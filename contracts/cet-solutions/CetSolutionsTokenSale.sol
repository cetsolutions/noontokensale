// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "./CetSolutionsCoin.sol";
import "./Administrable.sol";

import "../zeppelin-solidity/contracts/math/SafeMath.sol";


contract CetSolutionsTokenSale is Administrable {
    using SafeMath for uint256;

    address private mia;
    address private fundCollector;

    CetSolutionsCoin public tokenContract;

    bool public saleIsRunning = false;
    bool public saleClosed = false;

    uint256 public minimumTokenAmount = 1;
    uint256 public tokensPerWei = 1;

    event SaleStarted(address indexed by);
    event SaleEnded(address indexed by);
    event TokenPriceChanged(uint256 newValue, address indexed by);
    event TokensPurchased(address indexed buyer, uint price, uint256 amount);
    event AmountRefunded(uint amount, address indexed to);
    event TokenSaleEndedAutomatically(address indexed lastBuyer);
    event TokensIssuedManually(address indexed issuer, address indexed recipient, uint256 amount);
    event FundCollectorAccountChanged(address indexed previous, address indexed newAddress, address indexed by);

    function CetSolutionsTokenSale(
        address _mia, 
        address _fundCollector,
        uint256 _minimumTokenAmount, 
        uint256 _tokensPerWei) public {

        mia = _mia;
        fundCollector = _fundCollector;

        minimumTokenAmount = _minimumTokenAmount;
        tokensPerWei = _tokensPerWei;

    }

    function startSale() public onlyOwner {
        require(saleClosed == false);

        SaleStarted(msg.sender);
        
        saleIsRunning = true;
    }

    function endSale() public onlyOwner {
        SaleEnded(msg.sender);

        _endTokenSale();
    }

    function changeTokensPerWei(uint256 _newValue) public onlyAccount( mia ) {
        TokenPriceChanged(_newValue, msg.sender);

        tokensPerWei = _newValue;
    }

    function changeFundCollector(address _newFundCOllector) public onlyOwner {
        FundCollectorAccountChanged(fundCollector, _newFundCOllector, msg.sender);

        fundCollector = _newFundCOllector;
    }
/*
    function purchaseToken() public payable {
        require(saleIsRunning == true);

        uint256 tokensToBuy = msg.value.mul(tokensPerWei);
        require(tokensToBuy >= minimumTokenAmount);

        uint256 remaining = tokenContract.remainingTokens(); 

        if (tokensToBuy >= remaining) {
            uint256 refund = (tokensToBuy.sub(remaining)).div(tokensPerWei); 
        
            _purcacheHelper(remaining, msg.value.sub(refund));

            if (refund > 0) {
                AmountRefunded(refund, msg.sender);
                msg.sender.transfer(refund);
            }

            _endTokenSale();

            TokenSaleEndedAutomatically(msg.sender);
        } else {
            _purcacheHelper(tokensToBuy, msg.value);
        }
    }
*/
    function purchaseToken() public payable {
        require(saleIsRunning == true);

        uint256 tokensToBuy = msg.value.mul(tokensPerWei);
        require(tokensToBuy >= minimumTokenAmount);

        uint256 remaining = tokenContract.remainingTokens(); 

        if (tokensToBuy >= remaining) {
            uint256 refund = (tokensToBuy.sub(remaining)).div(tokensPerWei); 
        
            uint256 investment = msg.value.sub(refund);
            tokenContract.issueToken(msg.sender, remaining);
            fundCollector.transfer(investment);

            TokensPurchased(msg.sender, investment, tokensToBuy);
            if (refund > 0) {
                AmountRefunded(refund, msg.sender);
                msg.sender.transfer(refund);
            }

            _endTokenSale();

            TokenSaleEndedAutomatically(msg.sender);
        } else {
            tokenContract.issueToken(msg.sender, tokensToBuy);
            fundCollector.transfer(msg.value);
        }
    }

    function issueToken(address _to, uint256 _amount) public onlyAccount( mia ) {
        TokensIssuedManually(msg.sender, _to, _amount);

        tokenContract.issueToken(_to, _amount);
    }

    function _endTokenSale() private {
        require(saleIsRunning == true);

        SaleEnded(msg.sender);

        saleIsRunning = false;
        saleClosed = true;

        mia = owner;

        tokenContract.openSecondaryMarket();
        if (this.balance > 0) {
            fundCollector.transfer(this.balance);
        }
    }
/*
    function _purcacheHelper(uint256 _tokenCount, uint256 _investment) private {
        tokenContract.issueToken(msg.sender, _tokenCount);
        fundCollector.transfer(_investment);

        TokensPurchased(msg.sender, _investment, _tokenCount);
    }
*/
}