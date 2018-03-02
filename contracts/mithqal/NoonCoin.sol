// solhint-disable-next-line compiler-fixed, compiler-gt-0_4
pragma solidity ^0.4.17;

import "../cet-solutions/CetSolutionsCoin.sol";


contract NoonCoin is CetSolutionsCoin {
    // solhint-disable-next-line const-name-snakecase
    string public constant name = "Noon Coin";
    // solhint-disable-next-line const-name-snakecase
    string public  constant symbol = "NOON";
    // solhint-disable-next-line const-name-snakecase
    uint8 public  constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 100 * (10 ** uint256(decimals));

    function NoonCoin(address _owner, address _wla) public CetSolutionsCoin(_owner, _wla, msg.sender) {
        balances[secondaryMarketManager] = INITIAL_SUPPLY;
    }
}