pragma solidity 0.4.24;

import "../cet-solutions/Administrable.sol";


contract AdministrableTestContract is Administrable {

    address public _account;

    constructor(address account) public Administrable()
    {
        _account = account;
    } 

    function testOnlyAccount() public view onlyAccount(_account) 
    {
        
    }

}