// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "./Administrable.sol";


contract ClosableSecondaryMarket is Administrable {

    address public secondaryMarketManager;

    bool public secondaryMarketOpen = false;

    event SecondaryMarketOpened(address indexed by);
    
    event SecondaryMarketManagerChanged(
        address indexed previousManager, 
        address indexed newManager, 
        address indexed by
    );

    function ClosableSecondaryMarket(address _secondaryMarketManager) public {
        secondaryMarketManager = _secondaryMarketManager;
    }

    modifier onlySecondaryMarketManager() {
        require(msg.sender == secondaryMarketManager);
        _;
    }

    modifier onlyInOpenSecondaryMarket() {
        require(secondaryMarketOpen);
        _;
    }

    function openSecondaryMarket() public onlyAccount( secondaryMarketManager ) {
        SecondaryMarketOpened(msg.sender);

        secondaryMarketOpen = true;
    }

    function changeSecondaryMarketManager(address _newSecondaryMarketManager) public {
        require(msg.sender == owner || msg.sender == secondaryMarketManager);

        SecondaryMarketManagerChanged(secondaryMarketManager, _newSecondaryMarketManager, msg.sender);

        secondaryMarketManager = _newSecondaryMarketManager;
    }
}