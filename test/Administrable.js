import utils from './helpers/utils';

const AdminsitrableTestContract = artifacts.require('./test-contracts/AdministrableTestContract.sol');

const Web3 = require('web3');

const provider = new Web3.providers.HttpProvider("http://localhost:8545");

contract('Adminsitrable', ([owner, administrator]) => {

    let adminsitrableTest;

    beforeEach('setup test contract', async () => {
        AdminsitrableTestContract.setProvider(provider);
        adminsitrableTest = await AdminsitrableTestContract.new(administrator);
    });

    it('has an owner', async () => {
        assert.equal(await adminsitrableTest.owner(), owner);
    });

    it('has an account stored', async () => {
        assert.equal(await adminsitrableTest._account(), administrator);
    });

    it('should throw because not the caller is not "_account"', async () =>{
        await utils.expectThrow(adminsitrableTest.testOnlyAccount({from: owner}));
    });

    it('should succeed because not the caller is the "_account"', async () =>{
        await adminsitrableTest.testOnlyAccount({from: administrator});
    });

});
