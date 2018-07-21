import utils from './helpers/utils'
import {BigNumber} from 'bignumber.js'

const CetSolutionsTokenSaleTestContract = artifacts.require('./test-contracts/CetSolutionsTokenSaleTestContract.sol')
const CetSolutionsCoinTestContract = artifacts.require('./test-contracts/CetSolutionsCoinTestContract.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")
const web3 = new Web3(provider)

contract('CetSolutionsTokenSale', ([owner, MIA, WLA, fundCollector, buyer1, buyer2, buyer3, newOwner, newMIA, newFundCollector]) => {

    let minimumTokenAmount = 2 * Math.pow(10, 18)
 
    let initialTokenAmount = 10 * Math.pow(10, 18)

    let tokensPerWei = 1

    let testContract

    let tokenContract

    beforeEach('setup test contract', async () => {
        BigNumber.set({
            DECIMAL_PLACES: 30
        })
        CetSolutionsTokenSaleTestContract.setProvider(provider)
        CetSolutionsCoinTestContract.setProvider(provider)
        testContract = await CetSolutionsTokenSaleTestContract.new(MIA, WLA, fundCollector, minimumTokenAmount, initialTokenAmount, tokensPerWei)
        tokenContract = new CetSolutionsCoinTestContract(await testContract.tokenContract())
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

    describe('Start and end sale', () => {
        it('should start with not running sale', async () => {
            assert.isNotOk(await testContract.saleIsRunning())
        })

        it('should start with sale not yet closed', async () => {
            assert.isNotOk(await testContract.saleClosed())
        })

        it('should allow the owner to start the sale', async () => {
            assert.isOk(await testContract.startSale({from: owner}))
            assert.isOk(await testContract.saleIsRunning())
        })

        it('should not allow anyone else than the owner to start the sale', async () => {
            await utils.expectThrow(testContract.startSale({from: buyer1}))
            assert.isNotOk(await testContract.saleIsRunning())
        })

        it('should fire the "SaleStarted" event when starting the sale', async () => {
            await utils.expectEvent(
                testContract.startSale({from: owner}), 
                {
                    event: 'SaleStarted',
                    args: {
                        by: owner
                    }
                }
            )
        })

        it('should allow the owner to end the running sale', async () => {
            await testContract.startSale({from: owner})
            assert.isOk(await testContract.endSale({from: owner}))
            assert.isNotOk(await testContract.saleIsRunning())
            assert.isOk(await testContract.saleClosed())
        })

        it('should not allow for anyone else than the owner', async () => {
            await testContract.startSale({from: owner})
            await utils.expectThrow(testContract.endSale({from: buyer1}))
            assert.isOk(await testContract.saleIsRunning())
            assert.isNotOk(await testContract.saleClosed())
        })

        it('should fire the "SaleEnded" event when ending the sale', async () => {
            await testContract.startSale({from: owner})
            await utils.expectEvent(
                testContract.endSale({from: owner}), 
                {
                    event: 'SaleEnded',
                    args: {
                        by: owner
                    }
                }
            )
        })

        it('should not allow to reopen a  closed sale', async () => {
            await testContract.startSale({from: owner})
            await testContract.endSale({from: owner})
            await utils.expectThrow(testContract.startSale({from: owner}))
        })

        it('should not allow to reopen a  closed sale', async () => {
            await testContract.startSale({from: owner})
            await testContract.endSale({from: owner})
            await utils.expectThrow(testContract.endSale({from: owner}))
        })

    })

    describe('Fund Collector', () => {
        it('should have a fund collector', async () => {
            assert.equal(await testContract.fundCollector(), fundCollector)
        })

        it('should allow the owner to change the fundcollector', async () => {
            assert.isOk(await testContract.changeFundCollector(newFundCollector, {from: owner}))
            assert.equal(await testContract.fundCollector(), newFundCollector)
        })

        it('should not allow anyone else than the owner to change the fundcollector', async () => {
            await utils.expectThrow(testContract.changeFundCollector(newFundCollector, {from: newFundCollector}))
            assert.equal(await testContract.fundCollector(), fundCollector)
        })
    })

    describe('tokensPerWei', () => {

        it('should have a tokensPerValue', async () => {
            utils.equalBig(await testContract.tokensPerWei(), tokensPerWei)
        })

        it('should allow the MIA to change the tokensPerWeiValue', async () => {
            assert.isOk(await testContract.changeTokensPerWei(tokensPerWei + 10, {from: MIA}))
            utils.equalBig(await testContract.tokensPerWei(), tokensPerWei + 10)
        })

        it('shuold not allow anyone else then the MIA to change the tokensPerWei value', async () => {
            await utils.expectThrow(testContract.changeTokensPerWei(tokensPerWei + 1, {from: buyer1}))
            utils.equalBig(await testContract.tokensPerWei(), tokensPerWei)
        })
    })

    describe('Minimum token amount', () => {
        it('should have a minimumTokenAmount', async () => {
            utils.equalBig(await testContract.minimumTokenAmount(), minimumTokenAmount)
        })
    })

    describe('token purchase', async () => {
        const valid_purchases = [
            (new BigNumber(minimumTokenAmount)),
            (new BigNumber(minimumTokenAmount)).plus(1),
            (new BigNumber(minimumTokenAmount)).plus(100000),
            (new BigNumber(initialTokenAmount)),
            (new BigNumber(initialTokenAmount)).minus(1),
            (new BigNumber(initialTokenAmount)).minus(100000)
        ]
        valid_purchases.forEach((tokens) => {
            it('should allow whitelisted people to buy tokens ('+tokens.toString()+')', async () => {
                const tokensPerWei = await testContract.tokensPerWei()
                await tokenContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.startSale({from: owner})
                const fundCollectorBalance = web3.eth.getBalance(fundCollector)
                assert.isOk(await testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})) 
                utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount).minus(tokens))
                utils.equalBig(await tokenContract.balanceOf(buyer1), tokens)
                utils.equalBig(web3.eth.getBalance(fundCollector).minus(fundCollectorBalance), tokens.dividedToIntegerBy(tokensPerWei))
                
            })                
        })

        const invalid_purchases = [
            (new BigNumber(minimumTokenAmount)).minus(1),
            (new BigNumber(minimumTokenAmount)).minus(100000),
            (new BigNumber(-1))
        ]
        invalid_purchases.forEach((tokens) => {
            it('should not allow to buy invalid amount of tokens ('+tokens.toString()+')', async () => {
                const tokensPerWei = await testContract.tokensPerWei()
                await tokenContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.startSale({from: owner})
                await utils.expectThrow(testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})) 
                utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
                utils.equalBig(await tokenContract.balanceOf(buyer1), 0)
            })                
        })

        it('should add tokens while it can and transfer back the rest of the ETH', async () => {
            const tokensPerWei = await testContract.tokensPerWei()
            const gasPrice = 10
            await tokenContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.startSale({from: owner})
            const tokens = new BigNumber(initialTokenAmount).plus(initialTokenAmount)
            const fundCollectorBalance = web3.eth.getBalance(fundCollector)
            const initialBalance = web3.eth.getBalance(buyer1)
            const transaction = await testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1, gasPrice: gasPrice})
            utils.equalBig(await tokenContract.balanceOf(buyer1), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.remainingTokens(), 0)
            const currentBalance = web3.eth.getBalance(buyer1)
            utils.equalBig(currentBalance, initialBalance.minus(transaction.receipt.cumulativeGasUsed*gasPrice).minus(new BigNumber(initialTokenAmount).dividedToIntegerBy(tokensPerWei)))
            utils.equalBig(web3.eth.getBalance(fundCollector).minus(fundCollectorBalance), new BigNumber(initialTokenAmount).dividedToIntegerBy(tokensPerWei))
        })

        it('should fail to purchase in non running sale', async () => {
            const tokensPerWei = await testContract.tokensPerWei()
            const tokens = new BigNumber(minimumTokenAmount)
            await tokenContract.addToWhitelist(buyer2, {from: WLA})
            await utils.expectThrow(testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer2})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

        it('should fail to purchase from non whitelisted account', async () => {
            const tokensPerWei = await testContract.tokensPerWei()
            const tokens = new BigNumber(minimumTokenAmount)
            await testContract.startSale({from: owner})
            await utils.expectThrow(testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer2})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

        it('should fail to purchase when sale is closed', async () => {
            const tokensPerWei = await testContract.tokensPerWei()
            const tokens = new BigNumber(minimumTokenAmount)
            await testContract.startSale({from: owner})
            await tokenContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.endSale({from: owner})
            await utils.expectThrow(testContract.purchaseToken({value: tokens.dividedToIntegerBy(tokensPerWei).toString(), from: buyer2})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })
    })

    describe('Token issuance', () => {
        const valid_purchases = [
            (new BigNumber(minimumTokenAmount)),
            (new BigNumber(minimumTokenAmount)).plus(1),
            (new BigNumber(minimumTokenAmount)).plus(100000),
            (new BigNumber(initialTokenAmount)),
            (new BigNumber(initialTokenAmount)).minus(1),
            (new BigNumber(initialTokenAmount)).minus(100000)
        ]
        valid_purchases.forEach((tokens) => {
            it('should allow to issue token for whitelisted account ('+tokens.toString()+')', async () => {
                await tokenContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.startSale({from: owner})
                assert.isOk(await testContract.issueToken(tokens.toString(), buyer1, {from: MIA}))
                utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount).minus(tokens))
                utils.equalBig(await tokenContract.balanceOf(buyer1), tokens)
                
            })                
        })

        const invalid_purchases = [
            (new BigNumber(initialTokenAmount)).plus(1),
            (new BigNumber(initialTokenAmount)).plus(100000),
            (new BigNumber(-1))
        ]
        invalid_purchases.forEach((tokens) => {
            it('should not allow to issue invalid amount of tokens ('+tokens.toString()+')', async () => {
                await tokenContract.addToWhitelist(buyer1, {from: WLA})
                await testContract.startSale({from: owner})
                await utils.expectThrow(testContract.issueToken(tokens.toString(), buyer1, {from: MIA})) 
                utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
                utils.equalBig(await tokenContract.balanceOf(buyer1), 0)
            })                
        })

        it('should fail to issue in non running sale', async () => {
            const tokens = new BigNumber(minimumTokenAmount)
            await tokenContract.addToWhitelist(buyer2, {from: WLA})
            await utils.expectThrow(testContract.issueToken(tokens.toString(), buyer2, { from: MIA})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

        it('should fail to issue to non whitelisted account', async () => {
            const tokens = new BigNumber(minimumTokenAmount)
            await testContract.startSale({from: owner})
            await utils.expectThrow(testContract.issueToken(tokens.toString(), buyer2, {from: MIA})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

        it('should fail to issue when sale is closed', async () => {
            const tokens = new BigNumber(minimumTokenAmount)
            await testContract.startSale({from: owner})
            await tokenContract.addToWhitelist(buyer2, {from: WLA})
            await testContract.endSale({from: owner})
            await utils.expectThrow(testContract.issueToken(tokens.toString(), buyer2, {from: MIA})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

        it('should fail to issue from non MIA', async () => {
            const tokens = new BigNumber(minimumTokenAmount)
            await testContract.startSale({from: owner})
            await tokenContract.addToWhitelist(buyer2, {from: WLA})
            await utils.expectThrow(testContract.issueToken(tokens.toString(), buyer2, {from: buyer2})) 
            utils.equalBig(await tokenContract.remainingTokens(), new BigNumber(initialTokenAmount))
            utils.equalBig(await tokenContract.balanceOf(buyer2), 0)
        })

    })

    describe('Events', () => {
        it('should fire the "SaleStarted" event', async () => {
            await utils.expectEvent(
                testContract.startSale({from:owner}),
                {
                    event: 'SaleStarted',
                    args: {
                        by: owner
                    }
                }
            )
        })

        it('should fire the "SaleEnded" event', async () => {
            await testContract.startSale({from: owner})
            await utils.expectEvent(
                testContract.endSale({from: owner}),
                {
                    event: 'SaleEnded',
                    args: {
                        by: owner
                    }
                }
            )
        })

        it('should fire the "TokenPriceChanged" event', async () => {
            await utils.expectEvent(
                testContract.changeTokensPerWei(2, {from: MIA}),
                {
                    event: 'TokenPriceChanged',
                    args: {
                        newValue: new BigNumber(2),
                        by: MIA
                    }
                }
            )
        })

        it('should fire the "TokensPurchased" event', async () => {
            await tokenContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.startSale({from: owner})
            const tokens = new BigNumber(minimumTokenAmount)
            await utils.expectEvent(
                testContract.purchaseToken({from: buyer1, value: tokens.dividedToIntegerBy(tokensPerWei).toString()}),
                {
                    event: 'TokensPurchased',
                    args: {
                        buyer: buyer1,
                        price: tokens.dividedToIntegerBy(tokensPerWei),
                        amount: tokens
                    }
                }
            )
        })

        it('should fire the "AmountRefunded" event', async () => {
            await tokenContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.startSale({from: owner})
            const tokens = new BigNumber(initialTokenAmount).multipliedBy(2)
            await utils.expectEvent(
                testContract.purchaseToken({from: buyer1, value: tokens.dividedToIntegerBy(tokensPerWei).toString()}),
                {
                    event: 'AmountRefunded',
                    args: {
                        amount: new BigNumber(initialTokenAmount).dividedToIntegerBy(tokensPerWei),
                        to: buyer1
                    }
                }
            )
        })

        it('should fire the "TokenSaleEndedAutomatically" event', async () => {
            await tokenContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.startSale({from: owner})
            const tokens = new BigNumber(initialTokenAmount).multipliedBy(2)
            await utils.expectEvent(
                testContract.purchaseToken({from: buyer1, value: tokens.dividedToIntegerBy(tokensPerWei).toString()}),
                {
                    event: 'TokenSaleEndedAutomatically',
                    args: {
                        lastBuyer: buyer1
                    }
                }
            )
        })

        it('should fire the "TokensIssuedManually" event', async () => {
            await tokenContract.addToWhitelist(buyer1, {from: WLA})
            await testContract.startSale({from: owner})
            const tokens = new BigNumber(minimumTokenAmount)
            await utils.expectEvent(
                testContract.issueToken(tokens.toString(), buyer1, {from: MIA}),
                {
                    event: 'TokensIssuedManually',
                    args: {
                        issuer: MIA,
                        recipient: buyer1,
                        amount: tokens
                    }
                }
            )
        })

        it('should fire the "FundCollectorAccountChanged" event', async () => {
            await utils.expectEvent(
                testContract.changeFundCollector(newFundCollector, {from:owner}),
                {
                    event: 'FundCollectorAccountChanged',
                    args: {
                        previous: fundCollector,
                        newAddress: newFundCollector,
                        by: owner
                    }
                }
            )
        })

    })

})
