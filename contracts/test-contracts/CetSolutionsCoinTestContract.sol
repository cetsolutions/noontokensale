pragma solidity 0.4.24;

import "../cet-solutions/CetSolutionsCoin.sol";


contract CetSolutionsCoinTestContract is CetSolutionsCoin {
    // solhint-disable-next-line const-name-snakecase
    string public constant name = "Test Coin";
    // solhint-disable-next-line const-name-snakecase
    string public  constant symbol = "TC";
    // solhint-disable-next-line const-name-snakecase
    uint8 public  constant decimals = 18;

    constructor(address _owner, address _wla, address _tsa, uint256 _initialTokenAmount) public 
        CetSolutionsCoin(_owner, _wla, _tsa) 
    {
        balances[tsa] = _initialTokenAmount;
    }
}
