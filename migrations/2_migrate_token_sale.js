const Web3 = require('web3');
const TruffleConfig = require('../truffle');

var NoonTokenSale = artifacts.require("./mithqal/NoonTokenSale.sol");
var NoonCoin = artifacts.require("./mithqal/NoonCoin.sol");


module.exports = function (deployer, network, addresses) {

    const config = TruffleConfig.networks[network];

    deployer.deploy(
        NoonTokenSale,
        '0x...',              // Manual Issuance Administrator
        '0x...',              // White List Administrator
        '0x...',              // Fund Collector
        10000000000000000000, // Minimum token amount: 10 * 10^18 = 10 NOON
        1                     // Tokens Per Wei: 1 wei = 1/10^18 NOON => 1 ether = 1 NOON
    ).then(async function () {
        let tokenSale = await NoonTokenSale.deployed();
        let address = await tokenSale.tokenContract();
        let coin = NoonCoin.at(address);

        // Currently authenticated as owner
        await tokenSale.startSale();

        // Authenticate as WLA
        const web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.host + ':' + config.port));
        await web3.eth.personal.unlockAccount("address_for_whitelist_admisitrator", "password_for_whitelist administrator", 360000);
        // Authenticate as person 1
        await web3.eth.personal.unlockAccount("address_for_person_1", "password_for_person_1", 360000);
        // Authenticate as person 2
        await web3.eth.personal.unlockAccount("address_for_person_2", "password_for_person_2", 360000);
        

        // Add Person #1 and Person #2 to whitelist
        await coin.addToWhitelist("0xaddress_for_person_1", {from: "address_for_whitelist_admisitrator"});
        await coin.addToWhitelist("0xaddress_for_person_2", {from: "address_for_whitelist_admisitrator"});

        let tr11 = await tokenSale.purchaseToken({from : "address_for_person_1", value: 30000000000000000000}); // Buy 30% of the tokens as Person #1
    });

};
