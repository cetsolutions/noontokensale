pragma solidity 0.4.24;

import "../zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Administrable.sol";
import "./Whitelisted.sol";
import "./OpenableSecondaryMarket.sol";
import "./EmergencyStoppable.sol";


contract CetSolutionsCoin is StandardToken, Administrable, Whitelisted, OpenableSecondaryMarket, EmergencyStoppable {

    constructor(address _owner, address _wla, address _tsa) public 
        Administrable() 
        Whitelisted( _wla ) 
        OpenableSecondaryMarket( _tsa ) 
    {
        // We define a different owner than the message sender.
        owner = _owner;
    }

    modifier notAdministrator(address addr)
    {
        require(addr != owner && addr != whitelistManager && addr != tsa);
        _;
    }

    function changeTSA(address _newTSA) public 
    {
        balances[_newTSA] = balances[tsa];
        balances[tsa] = 0;
        return super.changeTSA(_newTSA);
    }

    function transfer(address _to, uint256 _value) public 
        onlyWhitelisted( _to ) 
        notAdministrator( _to )
        onlyInOpenSecondaryMarket 
        onlyInNotEmergency 
        returns (bool) 
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public
        onlyWhitelisted( _to ) 
        notAdministrator( _to )
        onlyInOpenSecondaryMarket 
        onlyInNotEmergency
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }
    
    function issueToken(uint256 _value, address _to) public 
        onlyTSA()
        onlyWhitelisted( _to ) 
        notAdministrator( _to )
        onlyInNotEmergency()
        returns ( bool ) 
    {
        return super.transfer(_to, _value);
    }

    function remainingTokens() external view returns (uint256) {
        return balances[tsa];
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(allowed[msg.sender][_spender] == 0 || _value == 0);
        return super.approve(_spender, _value);
    }

    function increaseApproval(address /*_spender*/, uint256 /*_addedValue*/) public returns (bool) {
        revert();
    }

    function decreaseApproval(address /*_spender*/, uint256 /*_substractedValue*/) public returns (bool) {
        revert();
    }
}