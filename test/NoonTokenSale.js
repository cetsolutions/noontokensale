import utils from './helpers/utils'
import {BigNumber} from 'bignumber.js'
import { runInThisContext } from 'vm';

const NoonTokenSale = artifacts.require('./mithqal/NoonTokenSale.sol')
const NoonCoin = artifacts.require('./mithqal/NoonCoin.sol')

const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http://localhost:8545")
const web3 = new Web3(provider)

contract('NoonTokenSale', ([owner, MIA, WLA, fundCollector, buyer1, buyer2, buyer3, newWLA, newMIA, newFundcollector]) => {

    let tokenSale

    let token

    let tokensPerWei = new BigNumber(61793)

    let minimumTokenAmount = new BigNumber(100000).multipliedBy(new BigNumber(10).pow(18)).plus(15670)

    beforeEach('set up the token sale', async () => {
        BigNumber.set({
            DECIMAL_PLACES: 30
        })
        NoonTokenSale.setProvider(provider)
        NoonCoin.setProvider(provider)
        tokenSale = await NoonTokenSale.new(MIA, WLA, fundCollector, minimumTokenAmount.toString(), tokensPerWei.toString())
        token = new NoonCoin(await tokenSale.tokenContract())
    })

    describe('Basic token', () => {
        
        it('should be named Noon Digital Certificate', async () => {
            assert.equal(await token.name(), 'Noon Digital Certificate')
        })

        it('should have a symbol: NDC ', async () => {
            assert.equal(await token.symbol(), 'NDC')
        })

        it('should have a decimals vlaue of 18', async () => {
            assert.equal(await token.decimals(), 18)
        })

        it('should have set the administrator and owner accounts set correctly', async () => {
            assert.equal(await tokenSale.mia(), MIA)
            assert.equal(await tokenSale.fundCollector(), fundCollector)
            assert.equal(await tokenSale.owner(), owner)
            assert.equal(await token.owner(), owner)
            assert.equal(await token.whitelistManager(), WLA)
            assert.equal(await token.tsa(), tokenSale.address)
        })

        it('should allow the owner to change the administrators', async () => {
            assert.isOk(await tokenSale.changeMia(newMIA));
            assert.equal(await tokenSale.mia(), newMIA);
            assert.isOk(await tokenSale.changeFundCollector(newFundcollector))
            assert.equal(await tokenSale.fundCollector(), newFundcollector)
            assert.isOk(await tokenSale.transferOwnership(buyer1))
            assert.equal(await tokenSale.owner(), buyer1)
            assert.isOk(await token.changeWhitelistManager(newWLA))
            assert.equal(await token.whitelistManager(), newWLA)
            assert.isOk(await token.changeTSA(buyer2))
            assert.equal(await token.tsa(), buyer2)
            assert.isOk(await token.transferOwnership(buyer3))
            assert.equal(await token.owner(), buyer3)
        })

        it('should throw when changing the MIA to 0x0', async () => {
            await utils.expectThrow(tokenSale.changeMia("0x0"))
        })

        it('should throw when changing the Fundcollector to 0x0', async () => {
            await utils.expectThrow(tokenSale.changeFundCollector("0x0"))
        })

        it('should throw when changing the tokenSale owner to 0x0', async () => {
            await utils.expectThrow(tokenSale.transferOwnership("0x0"))
        })

        it('should throw when changing the WLA to 0x0', async () => {
            await utils.expectThrow(token.changeWhitelistManager("0x0"))
        })

        it('should throw when changing the TSA to 0x0', async () => {
            await utils.expectThrow(token.changeTSA("0x0"))
        })

        it('should throw when changing the token owner to 0x0', async () => {
            await utils.expectThrow(token.transferOwnership("0x0"))
        })

    })

    describe('Token trading', () => {

        beforeEach('set up prerequisites of trading a token',async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(buyer2, {from: WLA})
            await tokenSale.startSale({from: owner})
            await tokenSale.issueToken(minimumTokenAmount.times(3).toString(), buyer1, {from: MIA})
            await tokenSale.endSale({from: owner})
        })

        it('should allow to transfer token', async () => {
            assert.isOk(await token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(2))
            utils.equalBig(await token.balanceOf(buyer2), minimumTokenAmount)
        })

        it('should not allow to transfer more tokens than you have', async () => {
            await utils.expectThrow(token.transfer(buyer2, minimumTokenAmount.times(4).toString(), {from: buyer1}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(3))
            utils.equalBig(await token.balanceOf(buyer2), 0)
        })

        it('should not allow to spend my tokens to other people', async () => {
            await utils.expectThrow(token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from: buyer2}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(3))
            utils.equalBig(await token.balanceOf(buyer2), 0)
        })

        it('shuold allow to approve other person to spend my tokens', async () => {
            assert.isOk(await token.approve(buyer3, minimumTokenAmount.times(2).toString(), {from: buyer1}))
            utils.equalBig(await token.allowance(buyer1, buyer3), minimumTokenAmount.times(2))
        })

        it('should allow to spend approved tokens from other accounts', async () => {
            assert.isOk(await token.approve(buyer3, minimumTokenAmount.times(2).toString(), {from: buyer1}))
            assert.isOk(await token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from: buyer3}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(2))
            utils.equalBig(await token.balanceOf(buyer2), minimumTokenAmount)
            utils.equalBig(await token.balanceOf(buyer3), 0)
            utils.equalBig(await token.allowance(buyer1, buyer3), minimumTokenAmount)
        })

        it('should not allow people to spend more than approved tokens from an account', async () => {
            assert.isOk(await token.approve(buyer3, minimumTokenAmount.times(2).toString(), {from: buyer1}))
            await utils.expectThrow(token.transferFrom(buyer1, buyer2, minimumTokenAmount.times(4).toString(), {from: buyer3}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(3))
            utils.equalBig(await token.balanceOf(buyer2), 0)
            utils.equalBig(await token.balanceOf(buyer3), 0)
            utils.equalBig(await token.allowance(buyer1, buyer3), minimumTokenAmount.times(2))
        })

        it('should not allow people to spend too many tokens from an account but less than approved', async () => {
            assert.isOk(await token.approve(buyer3, minimumTokenAmount.times(5).toString(), {from: buyer1}))
            await utils.expectThrow(token.transferFrom(buyer1, buyer2, minimumTokenAmount.times(4).toString(), {from: buyer3}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.times(3))
            utils.equalBig(await token.balanceOf(buyer2), 0)
            utils.equalBig(await token.balanceOf(buyer3), 0)
            utils.equalBig(await token.allowance(buyer1, buyer3), minimumTokenAmount.times(5))
        })
    })

    describe('Exchange ratio', () => {
        it('should have a token exchange rate of ' + tokensPerWei.toString(), async () => {
            utils.equalBig(await tokenSale.tokensPerWei(), tokensPerWei)
        })

        it('should allow the MIA to change the token exchange rate', async () => {
            assert.isOk(await tokenSale.changeTokensPerWei(tokensPerWei.plus(10).toString(), {from: MIA}))
            utils.equalBig(await tokenSale.tokensPerWei(), tokensPerWei.plus(10))
        })

        it('should not allow other users to change the token exchange rate', async () => {
            await utils.expectThrow(tokenSale.changeTokensPerWei(tokensPerWei.plus(10).toString(), {from: buyer1}))
            utils.equalBig(await tokenSale.tokensPerWei(), tokensPerWei)
        })
    })

    describe('Token purchase', () => {
        
        beforeEach('set up token purchase prerequisites', async () => {
            await tokenSale.startSale({from: owner})
            await token.addToWhitelist(buyer1, {from: WLA})
        })

        const valid_purchases = [
            [minimumTokenAmount.dividedToIntegerBy(tokensPerWei), minimumTokenAmount],
            [minimumTokenAmount.plus(tokensPerWei).dividedToIntegerBy(tokensPerWei), minimumTokenAmount.plus(tokensPerWei)],
            [minimumTokenAmount.times(2).dividedToIntegerBy(tokensPerWei), minimumTokenAmount.times(2)]
        ]
        valid_purchases.forEach(([etherAmount, tokenAmount]) => {
            it('should allow to purchase tokens (' + etherAmount.toString() + ' wei for ' + tokenAmount.toString() + ' tokens)', async () => {
                assert.isOk(await tokenSale.purchaseToken({from: buyer1, value: etherAmount.toString()}))
                utils.equalBig(await token.remainingTokens(), (await token.INITIAL_SUPPLY()).minus(tokenAmount))
                utils.equalBig(await token.balanceOf(buyer1), tokenAmount)
            })
        })

        const invalid_purchases = [
            [minimumTokenAmount.minus(tokensPerWei).dividedToIntegerBy(tokensPerWei)],
            [minimumTokenAmount.minus(tokensPerWei.times(10)).dividedToIntegerBy(tokensPerWei)]
        ]
        invalid_purchases.forEach(([etherAmount]) => {
            it('should not allow to purchase less than the minimum amount of tokens (' + etherAmount.toString() + ' wei)', async () => {
                await utils.expectThrow(tokenSale.purchaseToken({from: buyer1, value: etherAmount.toString()}))
                utils.equalBig(await token.remainingTokens(), (await token.INITIAL_SUPPLY()))
                utils.equalBig(await token.balanceOf(buyer1), 0)
            })
        })

        it('should not allow to purchase too much tokens')
    })

    describe('Token issuance', () => {
        
        beforeEach('set up the prerequisites of token issuance', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await tokenSale.startSale({from: owner})
        })

        it('should allow the MIA to issue tokens', async () => {
            assert.isOk(await tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA}))
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount)
            utils.equalBig(await token.remainingTokens(), (await token.INITIAL_SUPPLY()).minus(minimumTokenAmount))
        })

        it('should not allow anyone else than MIA to issue tokens', async () => {
            await utils.expectThrow(tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: buyer1}))
            utils.equalBig(await token.balanceOf(buyer1), 0)
            utils.equalBig(await token.remainingTokens(), await token.INITIAL_SUPPLY())
        })
    })

    describe('White list', () => {
        
        beforeEach('start the token sale', async () => {
            await tokenSale.startSale({from: owner})
        })

        it('should not allow non white listed people to purchase token', async () => {
            await utils.expectThrow(tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1}))
            utils.equalBig(await token.balanceOf(buyer1), 0)
            utils.equalBig(await token.remainingTokens(), await token.INITIAL_SUPPLY())
        })

        it('should allow whitelisted people to purchase tokens', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            assert.isOk(await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1}))
        })

        it('should allow token owner to transfer tokens to whitelisted address', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(buyer2, {from: WLA})
            await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})
            await tokenSale.endSale({from:owner})

            assert.isOk(await token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
        })

        it('should fail to transfer tokens to non whitelisted address', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})
            await tokenSale.endSale({from:owner})

            await utils.expectThrow(token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
        })

        it('should fail to transferFrom tokens to non whitelisted address', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})
            await tokenSale.endSale({from:owner})
            await token.approve(buyer3, minimumTokenAmount.toString(), {from: buyer1})

            await utils.expectThrow(token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from: buyer3}))
            utils.equalBig(await token.allowance(buyer1, buyer3), minimumTokenAmount.toString())
            utils.equalBig(await token.balanceOf(buyer1), minimumTokenAmount.toString())
            utils.equalBig(await token.balanceOf(buyer2), 0)
        })

        it('should allow to transferFrom tokens to whitelisted address', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(buyer2, {from: WLA})
            await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1})
            await tokenSale.endSale({from:owner})
            await token.approve(buyer3, minimumTokenAmount.toString(), {from: buyer1})

            await assert.isOk(await token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from: buyer3}))
            utils.equalBig(await token.allowance(buyer1, buyer3), 0)
            utils.equalBig(await token.balanceOf(buyer1), 0)
            utils.equalBig(await token.balanceOf(buyer2), minimumTokenAmount.toString())
        })

        it('should fail to white list the invalid 0x0 address', async () => {
            await utils.expectThrow(token.addToWhitelist("0x0", {from: WLA}))
        })
    })

    describe('White list administration ', () => {
        it('should enable to put addresses to whitelist', async () => {
            assert.isOk(await token.addToWhitelist(buyer1, {from: WLA}))
            assert.isOk(await token.whitelist.call(buyer1))
        })

        it('should not allow anyone else than the MIA to manage the white list ', async () => {
            await utils.expectThrow(token.addToWhitelist(buyer1, {from: buyer1}))
        })

        it('should allow the owner to change the WLA', async () => {
            assert.isOk(await token.changeWhitelistManager(newWLA, {from: owner}))
            assert.isOk(await token.addToWhitelist(buyer1, {from: newWLA}))
        })
    })

    describe('Secondary market', () => {

        beforeEach('setup', async () => {
            await tokenSale.startSale({from:owner})
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(buyer2, {from: WLA})
            await tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA})
        })

        it('should fail to transfer token while the sale is running', async () => {
            await utils.expectThrow(token.transfer(buyer2, minimumTokenAmount.toString()))
        })

        it('should allow to transfer token after the sale is closed', async () => {
            await tokenSale.endSale({from: owner})
            assert.isOk(await token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
        })

        it('should allow the owner to end the sale and open the secondary market', async () => {
            assert.isOk(await tokenSale.endSale({from: owner}))
            assert.isOk(await token.secondaryMarketOpen())
        })

        it('should allow to transfer allowed tokens in open secondary market', async () => {
            await tokenSale.endSale({from: owner})
            await token.approve(buyer3, minimumTokenAmount.toString(), {from: buyer1});
            assert.isOk(await token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from:buyer3}))
        })

        it('should not allow to transfer allowed tokens in closed secondary market', async () => {
            await token.approve(buyer3, minimumTokenAmount.toString(), {from: buyer1});
            await utils.expectThrow(token.transferFrom(buyer1, buyer2, minimumTokenAmount.toString(), {from:buyer3}))            
        })

        it('should allow the owner to change the fund collector', async () => {
            const fundCollectorBalance = web3.eth.getBalance(fundCollector)
            const newFundCollectorBalance = web3.eth.getBalance(newFundcollector)
            assert.isOk(await tokenSale.changeFundCollector(newFundcollector))
            assert.equal(await tokenSale.fundCollector(), newFundcollector)
            assert.isOk(await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1}))
            utils.equalBig(web3.eth.getBalance(newFundcollector).minus(newFundCollectorBalance), minimumTokenAmount.dividedToIntegerBy(tokensPerWei))
            utils.equalBig(web3.eth.getBalance(fundCollector).minus(fundCollectorBalance), 0)
        })

    })

    describe('Emergency mode', () => {
        beforeEach('setup', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await tokenSale.startSale({from: owner})
        })

        it('should not allow to purchase while emergeny mode is on', async () => {
            assert.isOk(await token.declareEmergency({from: owner}))
            assert.isOk(await token.emergencyModeOn())
            await utils.expectThrow(tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1}))
        })

        it('should allow to purchase while emergeny mode is off', async () => {
            await token.declareEmergency({from: owner})
            assert.isOk(await token.cancelEmergency({from: owner}))
            assert.isNotOk(await token.emergencyModeOn())
            assert.isOk(await tokenSale.purchaseToken({value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString(), from: buyer1}))
        })

        it('shuold throw if non owner tries to declare emergency', async () => {
            await utils.expectThrow(token.declareEmergency({from: buyer1}))
        })

    })

    describe('Blacklisted managers', async () => {
        
        let addresses = {
            owner: null,
            WLA: null,
            TSA: null
        }

        let blacklist = ["owner", "WLA"]

        beforeEach(async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(owner, {from: WLA})
            await token.addToWhitelist(WLA, {from: WLA})
            await token.addToWhitelist(tokenSale.address, {from: WLA})
            await tokenSale.startSale({from: owner})
            await tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA})
            addresses.owner = owner
            addresses.WLA = WLA
        })

        blacklist.forEach(address => {

            it('should not allow to issue token to ' + address, async () => {
                await tokenSale.endSale({from: owner})
                await utils.expectThrow(token.transfer(addresses[address], minimumTokenAmount.toString(), {from: buyer1}))
            })

            it('should not allow to transfer to ' + address, async () => {
                await tokenSale.endSale({from: owner})
                await token.approve(buyer2, minimumTokenAmount.toString(), {from: buyer1})
                await utils.expectThrow(token.transferFrom(buyer1, addresses[address], minimumTokenAmount.toString(), {from: buyer2}))
            })
            
            it('should not allow to transferFrom to ' + address, async () => {
                await utils.expectThrow(tokenSale.issueToken(minimumTokenAmount.toString(), addresses[address], {from: MIA}))
            })
        })

        it('should not allow to issue token to TSA', async () => {
            await tokenSale.endSale({from: owner})
            let TSA = await token.tsa()
            await utils.expectThrow(token.transfer(TSA, minimumTokenAmount.toString(), {from: buyer1}))
        })

        it('should not allow to transfer to TSA', async () => {
            await tokenSale.endSale({from: owner})
            await token.approve(buyer2, minimumTokenAmount.toString(), {from: buyer1})
            let TSA = await token.tsa()
            await utils.expectThrow(token.transferFrom(buyer1, TSA, minimumTokenAmount.toString(), {from: buyer2}))
        })
        
        it('should not allow to transferFrom to TSA', async () => {
            await utils.expectThrow(tokenSale.issueToken(minimumTokenAmount.toString(), tokenSale.address, {from: MIA}))
        })


    })

    describe.skip('TSA', () => {
        it('should fail', async () => {
            assert.fail('It is changed after the requirements were written??')
        })
    })

    describe('MIA', () => {
        
        it('should have a MIA', async () => {
            assert.equal(await tokenSale.mia(), MIA)
        })

        var can_change = [
            [owner, 'owner'],
            [MIA, 'MIA']
        ]
        can_change.forEach(([address, name]) => {
            it('should allow to the '+name+' to change the MIA', async () => {
                assert.isOk(await tokenSale.changeMia(newMIA, {from: address}))
                assert.equal(await tokenSale.mia(), newMIA)
            })                
        })

        it('should not allow anyone else to change the MIA', async () => {
            await utils.expectThrow(tokenSale.changeMia(buyer1, {from: buyer1}))
            assert.equal(await tokenSale.mia(), MIA)
        })
    })

    describe('Secondary market', () => {
        
        beforeEach('prepare', async () => {
            await token.addToWhitelist(buyer1, {from: WLA})
            await token.addToWhitelist(buyer2, {from: WLA})
            await tokenSale.startSale({from: owner})
        })

        it('should allow the owner to close the sale and open the secondary market', async () => {
            assert.isOk(await tokenSale.endSale({from: owner}))
            assert.isOk(await token.secondaryMarketOpen(), 'The secondary market should open')
            assert.equal(await tokenSale.mia(), owner, 'The MIA of the token sale contract should be the owner')
            assert.equal(await token.tsa(), owner, 'The TSA of the token contract should be the owner')
        })

        it('should close the sale and open the secondary market is the last token is sold')

        it('should not allow anyone else than the owner to close the sale', async () => {
            await utils.expectThrow(tokenSale.endSale({from: buyer1}))
            assert.isOk(await tokenSale.saleIsRunning())
            assert.isNotOk(await token.secondaryMarketOpen())
        })

        it('should not allow to purchase token in a closed sale', async () => {
            await tokenSale.endSale({from: owner})
            await utils.expectThrow(tokenSale.purchaseToken({from: buyer1, value: minimumTokenAmount.dividedToIntegerBy(tokensPerWei).toString()}))
        })

        it('should not allow to issue token in a closed sale', async () => {
            await tokenSale.endSale({from: owner})
            await utils.expectThrow(tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA}))
        })

        it('shuold allow to trade tokens after the sale is closed', async () => {
            await tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA})
            await tokenSale.endSale({from: owner})

            assert.isOk(await token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
        })

        it('shuold not allow to trade tokens before the sale is closed', async () => {
            await tokenSale.issueToken(minimumTokenAmount.toString(), buyer1, {from: MIA})
            
            await utils.expectThrow(token.transfer(buyer2, minimumTokenAmount.toString(), {from: buyer1}))
        })

    })
})
