pragma solidity 0.4.24;

import "./Administrable.sol";

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Whitelisted is Administrable {

    address public whitelistManager;

    mapping(address => bool) public whitelist;

    event AddedToWhitelist(address indexed member, address indexed by);
    event WhiteListAccountChanged(address indexed from, address indexed to, address indexed by);

    constructor(address _whitelistManager) public {
        whitelistManager = _whitelistManager;
    }

    modifier onlyWhitelisted(address account) {
        require(whitelist[account]);
        _;
    }

    function addToWhitelist(address _member) external onlyAccount(whitelistManager) addressNotNull(_member) {
        emit AddedToWhitelist(_member, msg.sender);

        whitelist[_member] = true;
    }

    function changeWhitelistManager(address _newWhitelistManager) external onlyOwner addressNotNull(_newWhitelistManager) {
        emit WhiteListAccountChanged(whitelistManager, _newWhitelistManager, msg.sender);

        whitelistManager = _newWhitelistManager;
    }


}