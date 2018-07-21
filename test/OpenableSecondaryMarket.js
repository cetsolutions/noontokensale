import utils from './helpers/utils'

const OpenableSecondaryMarketTestContract = artifacts.require('./test-contracts/OpenableSecondaryMarketTestContract.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")

contract('OpenableSecondaryMarket', ([owner, TSA, newTSA, otherAccount]) => {

    let testContract

    beforeEach('setup test contract', async () => {
        OpenableSecondaryMarketTestContract.setProvider(provider)
        testContract = await OpenableSecondaryMarketTestContract.new(TSA)
    })

    it('has an owner', async () => {
        assert.equal(await testContract.owner(), owner, 'The owner should be ' + owner)
    })

    it('has a secondary market manager', async () => {
        assert.equal(await testContract.tsa(), TSA, 'The secondary market manager should be ' + TSA)
    })

    it('allows to change the SMM to the owner', async () =>{
        assert.isOk(await testContract.changeTSA(newTSA, {from: owner}))
        assert.equal(await testContract.tsa(), newTSA)
    })

    it('allows to change the SMM to the SMM', async () =>{
        assert.isOk(await testContract.changeTSA(newTSA, {from: TSA}))
        assert.equal(await testContract.tsa(), newTSA)
    })

    it('does not allow to changfe the SMM to other users', async() => {
        await utils.expectThrow(testContract.changeTSA(newTSA, {from: otherAccount}))
    })

    it('fires the "TSAChanged" event when changing the SMM', async () => {
        await utils.expectEvent(
            testContract.changeTSA(newTSA, {from: owner}),
            {
                event: 'TSAChanged',
                args: {
                    previousManager: TSA,
                    newManager: newTSA,
                    by: owner
                }
            }
        )
    })

    it('starts with closed secondary market', async () => {
        assert.isNotOk(await testContract.secondaryMarketOpen())
    })

    it('allows the SMM to open the secondary market', async () => {
        assert.isOk(await testContract.openSecondaryMarket({from: TSA}))
        assert.isOk(await testContract.secondaryMarketOpen())
    })

    it('fires the "SecondaryMarketOpened" event when opening the secondary market', async () => {
        await utils.expectEvent(
            testContract.openSecondaryMarket({from: TSA}),
            {
                event: 'SecondaryMarketOpened',
                args: {
                    by: TSA
                }
            }
        )
    })

    it('does not allow to open the secondary market for other than SMM', async () => {
        await utils.expectThrow(testContract.openSecondaryMarket({from: owner}))
        assert.isNotOk(await testContract.secondaryMarketOpen())
    })

    it('allows to call function marked "onlyTSA" for SMM', async () => {
        assert.isOk(await testContract.testOnlyTSA({from: TSA}))
    })

    it('does not allow to call function marked "onlyTSA" for other than SMM', async () => {
        await utils.expectThrow(testContract.testOnlyTSA({from: owner}))
    })

    it('allows to call function marked "onlyInOpenSecondaryMarket" in open secondary market', async () => {
        await testContract.openSecondaryMarket({from: TSA})
        assert.isOk(await testContract.testOnlyInOpenSecondaryMarket())
    })

    it('does not allow to call function marked "onlyInOpenSecondaryMarket" in closed secondary market', async () => {
        await utils.expectThrow(testContract.testOnlyInOpenSecondaryMarket())
    })
})
