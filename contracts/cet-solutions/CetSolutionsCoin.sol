// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "../zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Administrable.sol";
import "./Whitelisted.sol";
import "./ClosableSecondaryMarket.sol";
import "./EmergencyStoppable.sol";


contract CetSolutionsCoin is StandardToken, Administrable, Whitelisted, ClosableSecondaryMarket, EmergencyStoppable {

    // solhint-disable-next-line const-name-snakecase
    string public constant name = "Noon Coin";
    // solhint-disable-next-line const-name-snakecase
    string public  constant symbol = "NOON";
    // solhint-disable-next-line const-name-snakecase
    uint8 public  constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 100 * (10 ** uint256(decimals));

    function CetSolutionsCoin(address _owner, address _wla, address _tsa) public 
        Administrable() 
        Whitelisted( _wla ) 
        ClosableSecondaryMarket( _tsa ) 
    {
        // We define a different owner than the message sender.
        owner = _owner;
    }

    function transfer(address _to, uint256 _value) public 
        onlyWhitelisted( _to ) 
        onlyInOpenSecondaryMarket 
        onlyInNotEmergency 
        returns (bool) 
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public
        onlyWhitelisted( _to ) 
        onlyInOpenSecondaryMarket 
        onlyInNotEmergency
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }
    
    function issueToken(address _to, uint256 _value) public 
        onlySecondaryMarketManager
        onlyWhitelisted( _to ) 
        onlyInNotEmergency
        returns ( bool ) 
    {
        return super.transfer(_to, _value);
    }

    function remainingTokens() public view returns (uint256) {
        return balances[secondaryMarketManager];
    }

}