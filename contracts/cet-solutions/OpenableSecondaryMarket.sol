pragma solidity 0.4.24;

import "./Administrable.sol";


contract OpenableSecondaryMarket is Administrable {

    address public tsa;

    bool public secondaryMarketOpen = false;

    event SecondaryMarketOpened(address indexed by);

    event TSAChanged(
        address indexed previousManager, 
        address indexed newManager, 
        address indexed by
    );

    constructor(address _tsa) public {
        tsa = _tsa;
    }

    modifier onlyTSA() {
        require(msg.sender == tsa);
        _;
    }

    modifier onlyInOpenSecondaryMarket() {
        require(secondaryMarketOpen);
        _;
    }

    function openSecondaryMarket() external onlyAccount( tsa ) {
        emit SecondaryMarketOpened(msg.sender);

        secondaryMarketOpen = true;
    }

    function changeTSA(address _newTSA) public addressNotNull(_newTSA) {
        require(msg.sender == owner || msg.sender == tsa);

        emit TSAChanged(tsa, _newTSA, msg.sender);

        tsa = _newTSA;
    }
}