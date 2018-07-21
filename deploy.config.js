/**
 * This is the configuration file for the 
 * multi-sig wallets for NDC smart contract deployment.
 */

module.exports = {
    minimumTokenAmount: 1,
    tokensPerWei: 1,
    wallets: {
        owner: {
            multisig: true,
            requiredSignatures: 1,
            addresses: [
                "0x18ed7eAB729435a8506164DFC5338B2adD4551a2",
                "0x1C66C725f8059f549Fff501bF7822bbC13D79e1E"
            ]
        },
        fundcollector: {
            multisig: true,
            requiredSignatures: 2,
            addresses: [
                "0xCA9e5063C2f6B631a444529Bf69Ab3030d79B6f5",
                "0xC9a734a01e1FFdfBDB823375cf54A36c6D42d05b"
            ]
        },
        wla: {
            multisig: false,
            address: "0x5d7b545C069B3ceD3953e00b526ea73482a9F51A"
        },
        mia: {
            multisig: false,
            address: "0x9b2A97EE128316390C603D4D9Fa70EbF9F5F73e5"
        }
    }
}