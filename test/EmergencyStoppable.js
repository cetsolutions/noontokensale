import utils from './helpers/utils'

const EmergencyStoppableTestContract = artifacts.require('./test-contracts/EmergencyStoppableTestContract.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")

contract('EmergencyStoppable', ([owner, secondAccount]) => {

    let testContract

    beforeEach('setup test contract', async () => {
        EmergencyStoppableTestContract.setProvider(provider)
        testContract = await EmergencyStoppableTestContract.new()
    })

    it('has an owner', async () => {
        assert.equal(await testContract.owner(), owner, 'The owner should be ' + owner)
    })

    it('starts with emergeny mode off', async () => {
        assert.isNotOk(await testContract.emergencyModeOn(), 'The emergency mode should be turned off')
    })

    it('allows to turn on emergency mode for owner', async () => {
        assert.isOk(await testContract.declareEmergency({from: owner}))
        assert.isOk(await testContract.emergencyModeOn())
    })

    it('does not allow to turn on emergency when it is already on', async () => {
        await testContract.declareEmergency({from: owner})
        await utils.expectThrow(testContract.declareEmergency({from: owner}))
    })

    it('does not allow to turn on emergency mode for not owner', async () => {
        await utils.expectThrow(testContract.declareEmergency({from: secondAccount}))
        assert.isNotOk(await testContract.emergencyModeOn())
    })

    it('fires "EmergencyDeclared" event when declaring emergency', async () => {
        await utils.expectEvent(
            testContract.declareEmergency({from:owner}),
            {
                event: 'EmergencyDeclared',
                args: {
                    by: owner
                }
            }
        )
    })

    it('allows to execute funtion marked "onlyInNotEmergency" when emergency mode is off', async () => {
        assert.isOk(await testContract.testOnlyInNotEmergency())
    })

    it ('does not allow to execute function marked "onlyInEmergency" when emergeny mode is off', async () => {
        await utils.expectThrow(testContract.testOnlyInEmergency())
    })

    it('allows to execute funtion marked "onlyInEmergency" when emergency mode is on', async () => {
        await testContract.declareEmergency({from: owner})
        assert.isOk(await testContract.testOnlyInEmergency())
    })

    it ('does not allow to execute function marked "onlyInNotEmergency" when emergeny mode is on', async () => {
        await testContract.declareEmergency({from: owner})
        await utils.expectThrow(testContract.testOnlyInNotEmergency())
    })

    it('allows to cancel emergeny for owner', async () =>{
        await testContract.declareEmergency({from: owner})
        assert.isOk(await testContract.cancelEmergency({from: owner}))
        assert.isNotOk(await testContract.emergencyModeOn())
    })

    it('does not allow to cancel emergency if it is not on', async () => {
        await utils.expectThrow(testContract.cancelEmergency({from: owner}))
    })

    it('does not allow to cancel emergency mode for not owner', async () => {
        await testContract.declareEmergency({from: owner})
        await utils.expectThrow(testContract.cancelEmergency({from: secondAccount}))
        assert.isOk(await testContract.emergencyModeOn())
    })

    
    it('fires "EmergencyCancelled" event when cancelling emergency', async () => {
        await testContract.declareEmergency({from: owner})
        await utils.expectEvent(
            testContract.cancelEmergency({from:owner}),
            {
                event: 'EmergencyCancelled',
                args: {
                    by: owner
                }
            }
        )
    })

})
