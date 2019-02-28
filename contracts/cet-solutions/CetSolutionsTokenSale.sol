pragma solidity 0.4.24;

import "./CetSolutionsCoin.sol";
import "./Administrable.sol";

import "../zeppelin-solidity/contracts/math/SafeMath.sol";


contract CetSolutionsTokenSale is Administrable {
    using SafeMath for uint256;

    address public mia;
    address public fundCollector;

    CetSolutionsCoin public tokenContract;

    bool public saleIsRunning = false;
    bool public saleClosed = false;

    uint256 public minimumTokenAmount = 1;
    uint256 public tokensPerGwei = 1;

    event SaleStarted(address indexed by);
    event SaleEnded(address indexed by);
    event TokenPriceChanged(uint256 newValue, address indexed by);
    event TokensPurchased(address indexed buyer, uint256 price, uint256 amount);
    event AmountRefunded(uint256 amount, address indexed to);
    event TokenSaleEndedAutomatically(address indexed lastBuyer);
    event TokensIssuedManually(address indexed issuer, address indexed recipient, uint256 amount);
    event FundCollectorAccountChanged(address indexed previous, address indexed newAddress, address indexed by);

    constructor(
        address _mia, 
        address _fundCollector,
        uint256 _minimumTokenAmount, 
        uint256 _tokensPerEth) public {

        mia = _mia;
        fundCollector = _fundCollector;

        minimumTokenAmount = _minimumTokenAmount;
        _changeTokensPerEth(_tokensPerEth);
    }

    function startSale() external onlyOwner {
        require(saleClosed == false);

        emit SaleStarted(msg.sender);
        
        saleIsRunning = true;
    }

    function endSale() external onlyOwner {
        require(saleIsRunning == true);
        _endTokenSale();
    }

    function changeTokensPerEth(uint256 tokensPerEth) external onlyAccount( mia ) {
        emit TokenPriceChanged(tokensPerEth, msg.sender);

        _changeTokensPerEth(tokensPerEth);
    }

    function _changeTokensPerEth(uint256 tokensPerEth) private {
        tokensPerGwei = tokensPerEth.div(1e9);
    }

    function tokensPerEth() external view returns (uint256) {
        return tokensPerGwei.mul(1e9);
    }

    function changeFundCollector(address _newFundCollector) external onlyOwner addressNotNull(_newFundCollector) {
        emit FundCollectorAccountChanged(fundCollector, _newFundCollector, msg.sender);

        fundCollector = _newFundCollector;
    }

    function () external payable {
        require(msg.data.length == 0);
        require(saleIsRunning == true);

        uint gwei = msg.value.div(1e9);
        uint256 change = msg.value.sub(gwei.mul(1e9));
        if (change > 0) {
            msg.sender.transfer(change);
        }

        uint256 tokensToBuy = gwei.mul(tokensPerGwei);
        require(tokensToBuy >= minimumTokenAmount);

        uint256 remaining = tokenContract.remainingTokens(); 

        if (tokensToBuy >= remaining) {
            uint256 refund = (tokensToBuy.sub(remaining).div(tokensPerGwei).mul(1e9)); 
        
            uint256 investment = msg.value.sub(refund).sub(change);
            tokenContract.issueToken(remaining, msg.sender);
            fundCollector.transfer(investment);

            emit TokensPurchased(msg.sender, investment, remaining);
            if (refund > 0) {
                emit AmountRefunded(refund, msg.sender);
                msg.sender.transfer(refund);
            }

            _endTokenSale();

            emit TokenSaleEndedAutomatically(msg.sender);
        } else {
            tokenContract.issueToken(tokensToBuy, msg.sender);
            fundCollector.transfer(msg.value.sub(change));
            emit TokensPurchased(msg.sender, msg.value.sub(change), tokensToBuy);
        }
    }

    function issueToken(uint256 _amount, address _to) external onlyAccount( mia ) {
        require(saleIsRunning == true);
        emit TokensIssuedManually(msg.sender, _to, _amount);

        tokenContract.issueToken(_amount, _to);
    }

    function changeMia(address _newMia) external addressNotNull(_newMia) returns(bool) {
        require(msg.sender == owner || msg.sender == mia);
        
        mia = _newMia;

        return true;
    }

    function _endTokenSale() private {
        emit SaleEnded(msg.sender);

        saleIsRunning = false;
        saleClosed = true;

        mia = owner;

        
        tokenContract.openSecondaryMarket();
        
        tokenContract.changeTSA(owner);

        if (address(this).balance > 0) {
            fundCollector.transfer(address(this).balance);
        }
    }
}