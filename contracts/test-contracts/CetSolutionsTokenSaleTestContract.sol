pragma solidity 0.4.24;

import "../cet-solutions/CetSolutionsTokenSale.sol";
import "./CetSolutionsCoinTestContract.sol";


contract CetSolutionsTokenSaleTestContract is CetSolutionsTokenSale {

    constructor(
        address _mia, 
        address _wla, 
        address _fundCollector,
        uint256 _minimumTokenAmount, 
        uint256 _initialTokenAmount,
        uint256 _tokenPrice
        ) public
        CetSolutionsTokenSale(_mia, _fundCollector, _minimumTokenAmount, _tokenPrice)
    {
        tokenContract = new CetSolutionsCoinTestContract(msg.sender, _wla, this, _initialTokenAmount);
    }
}
