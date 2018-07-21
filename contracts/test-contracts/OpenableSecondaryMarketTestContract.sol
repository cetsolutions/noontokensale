pragma solidity 0.4.24;

import "../cet-solutions/OpenableSecondaryMarket.sol";


contract OpenableSecondaryMarketTestContract is OpenableSecondaryMarket {

    constructor(address _tsa) public OpenableSecondaryMarket(_tsa) 
    {

    }

    function testOnlyTSA() public view onlyTSA {

    }

    function testOnlyInOpenSecondaryMarket() public view onlyInOpenSecondaryMarket {

    }

}