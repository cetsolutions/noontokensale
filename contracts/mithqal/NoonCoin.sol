pragma solidity 0.4.24;

import "../cet-solutions/CetSolutionsCoin.sol";


contract NoonCoin is CetSolutionsCoin {
    // solhint-disable-next-line const-name-snakecase
    string public constant name = "Noon Digital Certificate";
    // solhint-disable-next-line const-name-snakecase
    string public  constant symbol = "NDC";
    // solhint-disable-next-line const-name-snakecase
    uint8 public  constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 28000000 * 100 * (10 ** uint256(decimals));

    constructor(address _owner, address _wla) public CetSolutionsCoin(_owner, _wla, msg.sender) {
        balances[tsa] = INITIAL_SUPPLY;
        totalSupply_ = INITIAL_SUPPLY;
    }
}