// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "./Administrable.sol";


contract EmergencyStoppable is Administrable {

    bool public emergencyModeOn = false;

    event EmergencyDeclared(address indexed by);
    event EmergencyCancelled(address indexed by);

    modifier onlyInEmergency() {
        require(emergencyModeOn);
        _;
    }

    modifier onlyInNotEmergency() {
        require(!emergencyModeOn);
        _;
    }

    function declareEmergency() public onlyOwner onlyInNotEmergency {
        EmergencyDeclared(msg.sender);

        emergencyModeOn = true;
    }

    function cancelEmergency() public onlyOwner onlyInEmergency {
        EmergencyCancelled(msg.sender);

        emergencyModeOn = false;
    }
}