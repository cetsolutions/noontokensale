const TokenSaleContract = artifacts.require('./mithqal/NoonTokenSale.sol')
const TokenContract = artifacts.require('./mithqal/NoonCoin.sol')

const MultiSigWallet = artifacts.require('./gnosis/contracts/MultiSigWallet.sol')
const config = require('./deploy.config')

function isValidAddress(address) {
    return address.match(/^0x[0-9a-zA-Z]{40}$/)
}

module.exports = async (callback) => {
    try {

        if (!config.wallets)
            throw `Invalid configuration! field 'wallets' is missing.`
        
        const wallet_names = [ 'owner', 'fundcollector', 'wla', 'mia' ]
        wallet_names.forEach(wallet => {
            if (!config.wallets[wallet])
                throw `Invalid configuration! 'wallets.${wallet}' is missing.`
            
            const w = config.wallets[wallet];
            if (w.multisig) {
                if (!w.requiredSignatures || !w.addresses || w.requiredSignatures > w.addresses.length)
                    throw `Invalid configuration! Wallet '${wallet}' has invalid settings. Make sure that 'requiredSignatures' and 'adresses' fields are present and containing valid data!`

                if (!w.addresses.reduce((prev, val ) => val = prev && isValidAddress(val), true))
                    throw `Invalid configuration! Invalid address found in account '${wallet}'!`
                    
            } else if (!isValidAddress(w.address)) {
                    throw `Invalid configuration! The address of account '${wallet}' is invalid`
            }

            if (typeof config.minimumTokenAmount != 'number')
                throw `Invalid configuration! Field 'minimumTokenAmount' must be defined as a number`

            if (typeof config.tokensPerWei != 'number')
                throw `Invalid configuration! Field 'minimumTokenAmount' must be defined as a number`
        })
            

        let wallets =  {}
        for (let i = 0; i < wallet_names.length; ++i) {
            const w = config.wallets[wallet_names[i]]
            if (w.multisig) {
                let msw = await MultiSigWallet.new(w.addresses, w.requiredSignatures)
                wallets[wallet_names[i]] = msw.address
                console.log(`Wallet '${wallet_names[i]}' created: ${wallets[wallet_names[i]]}`)    
            } else {
                wallets[wallet_names[i]] = w.address
                console.log(`Account '${wallet_names[i]}' used: ${wallets[wallet_names[i]]}`);
                
            }

        }

        console.log('');
        
        let tokenSale = await TokenSaleContract.new(wallets.mia, wallets.wla, wallets.fundcollector, config.minimumTokenAmount, config.tokensPerWei)
        let token = new TokenContract(await tokenSale.tokenContract());
        console.log(`Token sale contract created: ${tokenSale.address}`)
        console.log(`Token contract address: ${token.address}`)
        console.log('');
        
        await tokenSale.transferOwnership(wallets.owner)
        console.log(`TokenSale ownership transferred to the owner wallet.`);

        await token.transferOwnership(wallets.owner)
        console.log(`Token ownership transferred to the owner wallet.`);
    } finally {
        callback()
    }
}