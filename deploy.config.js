/**
 * This is the configuration file for the 
 * multi-sig wallets for NDC smart contract deployment.
 */

module.exports = {
    minimumTokenAmount: 37939255610000000000,
    tokensPerEth:        5229546993000000000,
    wallets: {
        owner: {
            multisig: false,
            address: "0xb54E1ae65f48Fc2375A3900B588a282cFF60a0AD"
        },
        fundcollector: {
            multisig: true,
            requiredSignatures: 3,
            addresses: [
                "0xA781Fa4E89271233eAFc4Def21431222eB5B4303",
                "0xb54E1ae65f48Fc2375A3900B588a282cFF60a0AD",
                "0xf618adc38BeCe37BF195a4be10a92a9dE119082D",
                "0xdc494e5CB430029e378718b2BA08ECd1385cE834",
                "0x9F2D7c0C79937891204C174276664d3C250c552c"
            ]
        },
        wla: {
            multisig: false,
            address: "0xA781Fa4E89271233eAFc4Def21431222eB5B4303"
        },
        mia: {
            multisig: false,
            address: "0xA781Fa4E89271233eAFc4Def21431222eB5B4303"
        }
    }
}