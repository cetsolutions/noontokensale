const Web3 = require('web3');

const TruffleConfig = require('../truffle');

var Migrations = artifacts.require("./Migrations.sol");


module.exports = async function(deployer, network, addresses) {
  const config = TruffleConfig.networks[network];

  const web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.host + ':' + config.port));
    
  console.log('>> Unlocking account ' + config.from);
  await web3.eth.personal.unlockAccount(config.from, "password_for_main_account", 360000);
  
  console.log('>> Deploying migration');
  await deployer.deploy(Migrations);
};