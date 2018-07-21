pragma solidity 0.4.24;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


contract EmergencyStoppable is Ownable {

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

    function declareEmergency() external onlyOwner onlyInNotEmergency {
        emit EmergencyDeclared(msg.sender);

        emergencyModeOn = true;
    }

    function cancelEmergency() external onlyOwner onlyInEmergency {
        emit EmergencyCancelled(msg.sender);

        emergencyModeOn = false;
    }
}