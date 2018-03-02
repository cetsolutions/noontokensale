// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Administrable is Ownable {

    modifier onlyAccount(address account) {
        require(msg.sender == account);
        _;
    }

}