// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "./Administrable.sol";

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Whitelisted is Administrable {

    address private whitelistManager;

    mapping(address => bool) public whitelist;

    event AddedToWhitelist(address indexed member, address indexed by);
    event WhiteListAccountChanged(address indexed from, address indexed to, address indexed by);

    function Whitelisted(address _whitelistManager) public {
        whitelistManager = _whitelistManager;
    }

    modifier onlyWhitelisted(address account) {
        require(whitelist[account]);
        _;
    }

    function addToWhitelist(address _member) public onlyAccount(whitelistManager) {
        AddedToWhitelist(_member, msg.sender);

        whitelist[_member] = true;
    }

    function changeWhitelistManager(address _newWhitelistManager) public onlyOwner {
        WhiteListAccountChanged(whitelistManager, _newWhitelistManager, msg.sender);

        whitelistManager = _newWhitelistManager;
    }


}