pragma solidity 0.4.24;

import "../cet-solutions/CetSolutionsTokenSale.sol";
import "./NoonCoin.sol";


contract NoonTokenSale is CetSolutionsTokenSale {
    
    constructor(
        address _mia, 
        address _wla, 
        address _fundCollector,
        uint256 _minimumTokenAmount, 
        uint256 _tokenPrice) public
        CetSolutionsTokenSale(_mia, _fundCollector, _minimumTokenAmount, _tokenPrice)
    {
        tokenContract = new NoonCoin(msg.sender, _wla);
    }

}