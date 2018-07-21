pragma solidity 0.4.24;

import "../cet-solutions/Whitelisted.sol";


contract WhitelistedTestContract is Whitelisted {

    constructor(address wla) public Whitelisted(wla)
    {

    } 

    function onlyToWhiteListed(address account) public view onlyWhitelisted(account)
    {

    }

    function onlyFromWhiteListed() public view onlyWhitelisted(msg.sender)
    {

    }
}