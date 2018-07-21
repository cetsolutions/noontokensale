import utils from './helpers/utils'
import {BigNumber} from 'bignumber.js';

const CetSolutionsCoinTestContract = artifacts.require('./test-contracts/CetSolutionsCoinTestContract.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")

contract('CetSolutionsCoin', ([deployer, owner, WLA, TSA, newTSA, buyer1, buyer2, buyer3, newOwner]) => {

    let testContract

    let initialTokenAmount = 1000 * Math.pow(10, 18)

    beforeEach('setup test contract', async () => {
        CetSolutionsCoinTestContract.setProvider(provider)
        testContract = await CetSolutionsCoinTestContract.new(owner, WLA, TSA, initialTokenAmount)
    })
    
    describe('is Owned', () => {
        it('should have an owner', async () => {
            assert.equal(await testContract.owner(), owner)
        })

        it('should allow the owner to transfer the ownership', async () => {
            assert.isOk(await testContract.transferOwnership(newOwner, {from: owner}))
            assert.equal(await testContract.owner(), newOwner)
        })

        it('shuold not allow anyone else to trnsfer the ownership', async () => {
            await utils.expectThrow(testContract.transferOwnership(newOwner, {from: newOwner}))
            assert.equal(await testContract.owner(), owner)
        })
    })

    describe('Approval', () => {
        let allowance = new BigNumber(10000)
        let new_allowance = new BigNumber(50000)
        
        beforeEach('add buyers to white list and issue some tokens to one of them', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.issueToken(10000, buyer1, {from: TSA})
        })

        it('should be able to approve account to spend', async () => {
            assert.isOk(await testContract.approve(buyer2, allowance.toString(), {from: buyer1}))
            utils.equalBig(await testContract.allowance(buyer1, buyer2), allowance)
        })

        it('should allow to modify allowance to zero', async () => {
            await testContract.approve(buyer2, allowance.toString(), {from: buyer1})
            assert.isOk(await testContract.approve(buyer2, 0, {from: buyer1}))
            utils.equalBig(await testContract.allowance(buyer1, buyer2), 0)
        })

        it('should not allow to modify allowance to non zero', async () => {
            await testContract.approve(buyer2, allowance.toString(), {from: buyer1})
            await utils.expectThrow(testContract.approve(buyer2, new_allowance.toString(), {from: buyer1}))
            utils.equalBig(await testContract.allowance(buyer1, buyer2), allowance)
        })

        it('should throw on increaseApproval', async () => {
            await testContract.approve(buyer2, allowance.toString(), {from: buyer1})
            await utils.expectThrow(testContract.increaseApproval(buyer2, new_allowance.toString(), {from: buyer1}))
            utils.equalBig(await testContract.allowance(buyer1, buyer2), allowance)
        })

        it('should throw on decreaseApproval', async () => {
            await testContract.approve(buyer2, allowance.toString(), {from: buyer1})
            await utils.expectThrow(testContract.increaseApproval(buyer2, new_allowance.toString(), {from: buyer1}))
            utils.equalBig(await testContract.allowance(buyer1, buyer2), allowance)
        })
    })

    describe('is ClosableSecondaryMarket', () => {
        it('should have a secondary market manager', async () => {
            assert.equal(await testContract.tsa(), TSA)
        })
    
        it('has all the tokens in the SMMs account', async () => {
            utils.equalBig(await testContract.balanceOf(TSA), new BigNumber(initialTokenAmount))
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
    
        it('does not allow to change the SMM to other users', async() => {
            await utils.expectThrow(testContract.changeTSA(newTSA, {from: buyer1}))
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
    
        it('can still issue tokens after changing the TSA', async () => {
            await testContract.changeTSA(newTSA, {from: owner})
            await testContract.addToWhitelist(buyer1, {from: WLA})

            assert.isOk(await testContract.issueToken(100000, buyer1, {from: newTSA}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })
    
        it('shuold fail to issue tokens with the original TSA after changing it', async () => {
            await testContract.changeTSA(newTSA, {from: owner})
            await testContract.addToWhitelist(buyer1, {from: WLA})

            await utils.expectThrow(testContract.issueToken(100000, buyer1, {from: TSA}))
            utils.equalBig(await testContract.balanceOf(buyer1), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount))
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
    })

    describe('is EmergencyStoppable', () => {
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
            await utils.expectThrow(testContract.declareEmergency({from: buyer1}))
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
            await utils.expectThrow(testContract.cancelEmergency({from: buyer1}))
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

    describe('is Whitelisted', () => {
        it('should not have an adress in the white list by default', async () => {
            assert.isNotOk(await testContract.whitelist.call(buyer1), 
            'The account should not be in the whitelist')
        })
    
        it('should be able to add to the whitelist called from WLA', async () => {
            assert.isOk(await testContract.addToWhitelist(buyer1, {from: WLA}))
        })
    
        it('should fail to add to the whitelist called from other than WLA', async () => {
            await utils.expectThrow(testContract.addToWhitelist(buyer1, {from: owner}))
        })
    
        it('should contain the white listed account after adding it as WLA', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            assert.isOk(await testContract.whitelist.call(buyer1), 
            'The account should be on the white list')
        })
        
        it('should fire event "AddedToWhitelist" when an address is added to whitelist', async () => {
            await utils.expectEvent(
                testContract.addToWhitelist(buyer1, {from: WLA}),
                {
                    event: "AddedToWhitelist",
                    args: {
                        member: buyer1,
                        by: WLA
                    }
                })
        })
    
        it('should succeed to change WLA as owner', async () => {
            assert.isOk(await testContract.changeWhitelistManager(buyer1, {from: owner}))
        })
    
        it('should fail to change WLA as not owner', async () => {
            await utils.expectThrow(testContract.changeWhitelistManager(buyer1, {from: WLA}))
        })
    
        it('should remove privileges of previous WLA', async () => {
            await testContract.changeWhitelistManager(buyer1, {from: owner})
            await utils.expectThrow(testContract.addToWhitelist(buyer1, {from: WLA}))
        })
    
        it('should give privileges to the new WLA', async() => {
            await testContract.changeWhitelistManager(buyer1, {from: owner})
            assert.isOk(await testContract.addToWhitelist(buyer2, {from: buyer1}))
        })
    
        it('should fire "WhiteListAccountChanged" event on WLA change', async () => {
            await utils.expectEvent(
                testContract.changeWhitelistManager(buyer1, {from: owner}),
                {
                    event: "WhiteListAccountChanged",
                    args: {
                        from: WLA,
                        to: buyer1,
                        by: owner
                    }
                })
        })            
    })

    describe('#issueToken', () => {
        it('should have all token as remaining at the start', async () => {
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount))
        })
    
        it('should issue tokens called from TSA, to a white listed account, in not emergency mode', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            assert.isOk(await testContract.issueToken(100000, buyer1, {from: TSA}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })
    
        it('should fail to issue token to non white listed account', async () => {
            await utils.expectThrow(testContract.issueToken(100000, buyer1, {from: TSA}))
            utils.equalBig(await testContract.balanceOf(buyer1), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount))
        })
    
        it('should fail to issue token from non TSA', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await utils.expectThrow(testContract.issueToken(100000, buyer1, {from: buyer1}))
            utils.equalBig(await testContract.balanceOf(buyer1), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount))
        })
    
        it('should fail to issue token when emergeny mode is on', async () => {
            await testContract.declareEmergency({from: owner})
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await utils.expectThrow(testContract.issueToken(100000, buyer1, {from: TSA}))
            utils.equalBig(await testContract.balanceOf(buyer1), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount))
        })            
    })

    describe('#transfer', () => {
        const valid_transfer_cases = [
            {issue: 100000, transfer: 60000},
            {issue: 100000, transfer: 100000},
            {issue: 100000, transfer: 0},
            {issue: 100000, transfer: 1},
            {issue: 100000, transfer: 99999}
        ]
        valid_transfer_cases.forEach(testCase => {
            it('should allow to transfer token to whitelisted account, in open secondary market, when it is not emergency ('+testCase.issue +', '+testCase.transfer+')', async () => {
                await testContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.addToWhitelist(buyer2, {from: WLA})
                await testContract.issueToken(testCase.issue, buyer1, {from: TSA})
                await testContract.openSecondaryMarket({from: TSA})
                
                assert.isOk(await testContract.transfer(buyer2, testCase.transfer, {from: buyer1}))
                utils.equalBig(await testContract.balanceOf(buyer1), testCase.issue - testCase.transfer)
                utils.equalBig(await testContract.balanceOf(buyer2), testCase.transfer)
                utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - testCase.issue))
            })            
        });
    
        const invalid_transfer_cases = [
            {issue: 100000, transfer: 100001},
            {issue: 100000, transfer: -1},
            {issue: 100000, transfer: 200000},
            {issue: 100000, transfer: -200000}
        ]
        invalid_transfer_cases.forEach(testCase => {
            it('should not allow to transfer invalid amount ('+testCase.issue +', '+testCase.transfer+')', async () => {
                await testContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.addToWhitelist(buyer2, {from: WLA})
                await testContract.issueToken(testCase.issue, buyer1, {from: TSA})
                await testContract.openSecondaryMarket({from: TSA})
                
                await utils.expectThrow(testContract.transfer(buyer2, testCase.transfer, {from: buyer1}))
                utils.equalBig(await testContract.balanceOf(buyer1), testCase.issue)
                utils.equalBig(await testContract.balanceOf(buyer2), 0)
                utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - testCase.issue))
            })            
        });   
        
        it('shuold fail to transfer in closed secondary market', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            
            await utils.expectThrow(testContract.transfer(buyer2, 50000, {from: buyer1}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

        it('should fail to transfer when emergency mode is on', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.openSecondaryMarket({from: TSA})
            await testContract.declareEmergency({from: owner})

            await utils.expectThrow(testContract.transfer(buyer2, 50000, {from: buyer1}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

        it('should fail to transfer to non white listed account', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.openSecondaryMarket({from: TSA})

            await utils.expectThrow(testContract.transfer(buyer2, 50000, {from: buyer1}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })
    })

    describe('#transferFrom', () => {
        const valid_transfer_from_cases = [
            {issue: 100000, allowance: 90000, transfer: 60000},
            {issue: 100000, allowance: 90000, transfer: 90000},
            {issue: 100000, allowance: 90000, transfer:     0},
            {issue: 100000, allowance: 90000, transfer:     1},
            {issue: 100000, allowance: 90000, transfer: 89999}
        ]
        valid_transfer_from_cases.forEach((testCase) => {
            it('should allow to transferFrom account when allowed, and recipient is whitlisted, secondary market is open, and is not emergency('+testCase.issue+', '+testCase.allowance+', '+testCase.transfer+')', async () => {
                await testContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.addToWhitelist(buyer3, {from: WLA})
                await testContract.issueToken(testCase.issue, buyer1, {from: TSA})
                await testContract.openSecondaryMarket({from: TSA})
                await testContract.approve(buyer2, testCase.allowance, {from: buyer1})
                
                utils.equalBig(await testContract.allowance(buyer1, buyer2), testCase.allowance)                
                assert.isOk(await testContract.transferFrom(buyer1, buyer3, testCase.transfer, {from: buyer2}))
                utils.equalBig(await testContract.allowance(buyer1, buyer2), testCase.allowance - testCase.transfer)                
                utils.equalBig(await testContract.balanceOf(buyer1), testCase.issue - testCase.transfer)
                utils.equalBig(await testContract.balanceOf(buyer2), 0)
                utils.equalBig(await testContract.balanceOf(buyer3), testCase.transfer)
                utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - testCase.issue))
            })
        })    
        
        const invalid_transfer_from_cases = [
            {issue: 100000, allowance: 90000, transfer:   90001},
            {issue: 100000, allowance: 90000, transfer:  100000},
            {issue: 100000, allowance: 90000, transfer:      -1},
            {issue: 100000, allowance: 90000, transfer: -100000}
        ]
        invalid_transfer_from_cases.forEach((testCase) => {
            it('should fail to transferFrom invalid amount ('+testCase.issue+', '+testCase.allowance+', '+testCase.transfer+')', async () => {
                await testContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.addToWhitelist(buyer3, {from: WLA})
                await testContract.issueToken(testCase.issue, buyer1, {from: TSA})
                await testContract.openSecondaryMarket({from: TSA})
                await testContract.approve(buyer2, testCase.allowance, {from: buyer1})
                
                utils.equalBig(await testContract.allowance(buyer1, buyer2), testCase.allowance)                
                await utils.expectThrow(testContract.transferFrom(buyer1, buyer3, testCase.transfer, {from: buyer2}))
                utils.equalBig(await testContract.allowance(buyer1, buyer2), testCase.allowance)                
                utils.equalBig(await testContract.balanceOf(buyer1), testCase.issue)
                utils.equalBig(await testContract.balanceOf(buyer2), 0)
                utils.equalBig(await testContract.balanceOf(buyer3), 0)
                utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - testCase.issue))
            })
        }) 
        
        it('shuold fail to transferFrom in closed secondary market', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.addToWhitelist(buyer3, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.approve(buyer2, 100000, {from: buyer1})

            await utils.expectThrow(testContract.transferFrom(buyer1, buyer3, 50000, {from: buyer2}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

        it('should fail to transferFrom when emergency mode is on', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.addToWhitelist(buyer3, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.approve(buyer2, 100000, {from: buyer1})
            await testContract.openSecondaryMarket({from: TSA})
            await testContract.declareEmergency({from: owner})

            await utils.expectThrow(testContract.transferFrom(buyer1, buyer3, 50000, {from: buyer2}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

        it('should fail to transferFrom to non white listed account', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.approve(buyer2, 100000, {from: buyer1})
            await testContract.openSecondaryMarket({from: TSA})

            await utils.expectThrow(testContract.transferFrom(buyer1, buyer3, 50000, {from: buyer2}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

        it('should fail to transferFrom when not approved', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer3, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.openSecondaryMarket({from: TSA})

            await utils.expectThrow(testContract.transferFrom(buyer1, buyer3, 50000, {from: buyer2}))
            utils.equalBig(await testContract.balanceOf(buyer1), 100000)
            utils.equalBig(await testContract.balanceOf(buyer2), 0)
            utils.equalBig(await testContract.remainingTokens(), new BigNumber(initialTokenAmount - 100000))
        })

    })

    describe('ERC20 events', () => {
        
        
        beforeEach('add buyers to white list and issue some tokens to one of them', async () => {
            await testContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.addToWhitelist(buyer3, {from: WLA})
            await testContract.issueToken(100000, buyer1, {from: TSA})
            await testContract.openSecondaryMarket({from: TSA})

        })

        it('should fire the "Transfer" event on transfer', async () => {
            await utils.expectEvent(
                testContract.transfer(buyer2, 100000, {from: buyer1}),
                {
                    event: 'Transfer',
                    args: {
                        from: buyer1,
                        to: buyer2,
                        value: new BigNumber(100000)
                    }
                }
            )
        })

        it('should fire the "Transfer" event on transferFrom', async () => {
            await testContract.approve(buyer3, 100000, {from: buyer1})
            await utils.expectEvent(
                testContract.transferFrom(buyer1, buyer2, 100000, {from: buyer3}),
                {
                    event: 'Transfer',
                    args: {
                        from: buyer1,
                        to: buyer2,
                        value: new BigNumber(100000)
                    }
                }
            )
        })

        it('should fire the "Transfer" event on issueToken', async () => {
            await utils.expectEvent(
                testContract.issueToken(1000, buyer1, {from: TSA}),
                {
                    event: 'Transfer',
                    args: {
                        from: TSA,
                        to: buyer1,
                        value: new BigNumber(1000)
                    }
                }
            )
        })

        it('should fire the "Approval" event on approve', async () => {
            await utils.expectEvent(
                testContract.approve(buyer2, 1000, {from: buyer1}),
                {
                    event: 'Approval',
                    args: {
                        owner: buyer1,
                        spender: buyer2,
                        value: new BigNumber(1000)
                    }
                }
            )
        })
    })
})
