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
    uint256 public tokensPerWei = 1;

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
        uint256 _tokensPerWei) public {

        mia = _mia;
        fundCollector = _fundCollector;

        minimumTokenAmount = _minimumTokenAmount;
        tokensPerWei = _tokensPerWei;
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

    function changeTokensPerWei(uint256 _newValue) external onlyAccount( mia ) {
        emit TokenPriceChanged(_newValue, msg.sender);

        tokensPerWei = _newValue;
    }

    function changeFundCollector(address _newFundCollector) external onlyOwner addressNotNull(_newFundCollector) {
        emit FundCollectorAccountChanged(fundCollector, _newFundCollector, msg.sender);

        fundCollector = _newFundCollector;
    }

    function purchaseToken() external payable {
        require(saleIsRunning == true);

        uint256 tokensToBuy = msg.value.mul(tokensPerWei);
        require(tokensToBuy >= minimumTokenAmount);

        uint256 remaining = tokenContract.remainingTokens(); 

        if (tokensToBuy >= remaining) {
            uint256 refund = (tokensToBuy.sub(remaining)).div(tokensPerWei); 
        
            uint256 investment = msg.value.sub(refund);
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
            fundCollector.transfer(msg.value);
            emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
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