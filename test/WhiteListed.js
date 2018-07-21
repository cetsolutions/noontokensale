import utils from './helpers/utils'

const WhitelistedTestContract = artifacts.require('./test-contracts/WhiteListedTestContract.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")

contract('WhiteListed', ([owner, WLA, thirdAccount, fourthAccount]) => {

    let testContract

    beforeEach('setup test contract', async () => {
        WhitelistedTestContract.setProvider(provider)
        testContract = await WhitelistedTestContract.new(WLA)
    })

    it('should have an owner', async () => {
        assert.equal(await testContract.owner(), owner, 'The owner should be ' + owner)
    })

    it('should not have an adress in the white list by default', async () => {
        assert.isNotOk(await testContract.whitelist.call(thirdAccount), 
        'The account should not be in the whitelist')
    })

    it('should be able to add to the whitelist called from WLA', async () => {
        assert.isOk(await testContract.addToWhitelist(thirdAccount, {from: WLA}))
    })

    it('should fail to add to the whitelist called from other than WLA', async () => {
        await utils.expectThrow(testContract.addToWhitelist(thirdAccount, {from: owner}))
    })

    it('should contain the white listed account after adding it as WLA', async () => {
        await testContract.addToWhitelist(thirdAccount, {from: WLA})
        assert.isOk(await testContract.whitelist.call(thirdAccount), 
        'The account should be on the white list')
    })

    it('should fail to call restricted function from non white listed account', async () => {
        await utils.expectThrow(testContract.onlyFromWhiteListed({from: thirdAccount}))
    })

    it('should fail to call with parameter not on white list', async () => {
        await utils.expectThrow(testContract.onlyToWhiteListed(thirdAccount))
    })

    it('should succeed to call restriced account after added to white list', async () => {
        await testContract.addToWhitelist(thirdAccount, {from: WLA})
        assert.isOk(await testContract.onlyFromWhiteListed({from: thirdAccount}), 'The call should have succeded')
    })

    it('should succeed to call with address on the white list', async () => {
        await testContract.addToWhitelist(thirdAccount, {from: WLA})
        assert.isOk(await testContract.onlyToWhiteListed(thirdAccount), 'The call should have succeeded')
    })
    
    it('should fire event "AddedToWhitelist" when an address is added to whitelist', async () => {
        await utils.expectEvent(
            testContract.addToWhitelist(thirdAccount, {from: WLA}),
            {
                event: "AddedToWhitelist",
                args: {
                    member: thirdAccount,
                    by: WLA
                }
            })
    })

    it('should succeed to change WLA as owner', async () => {
        assert.isOk(await testContract.changeWhitelistManager(thirdAccount, {from: owner}))
    })

    it('should fail to change WLA as not owner', async () => {
        await utils.expectThrow(testContract.changeWhitelistManager(thirdAccount, {from: WLA}))
    })

    it('should remove privileges of previous WLA', async () => {
        await testContract.changeWhitelistManager(thirdAccount, {from: owner})
        await utils.expectThrow(testContract.addToWhitelist(thirdAccount, {from: WLA}))
    })

    it('should give privileges to the new WLA', async() => {
        await testContract.changeWhitelistManager(thirdAccount, {from: owner})
        assert.isOk(await testContract.addToWhitelist(fourthAccount, {from: thirdAccount}))
    })

    it('should fire "WhiteListAccountChanged" event on WLA change', async () => {
        await utils.expectEvent(
            testContract.changeWhitelistManager(thirdAccount, {from: owner}),
            {
                event: "WhiteListAccountChanged",
                args: {
                    from: WLA,
                    to: thirdAccount,
                    by: owner
                }
            })
    })
})
