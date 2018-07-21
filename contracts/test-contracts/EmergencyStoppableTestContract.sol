pragma solidity 0.4.24;

import "../cet-solutions/EmergencyStoppable.sol";


contract EmergencyStoppableTestContract is EmergencyStoppable {

    function testOnlyInEmergency() public view onlyInEmergency {

    }

    function testOnlyInNotEmergency() public view onlyInNotEmergency {

    }

}