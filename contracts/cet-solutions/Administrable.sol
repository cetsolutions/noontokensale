pragma solidity 0.4.24;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Administrable is Ownable {

    modifier onlyAccount(address account) {
        require(msg.sender == account);
        _;
    }

    modifier addressNotNull(address addr) {
        require(addr != address(0x0));
        _;
    }

}