require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: { chainId: 31337, blockConfirmations: 1 },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [SEPOLIA_PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
    },etherscan: { apiKey: ETHERSCAN_API_KEY },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        //coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
    solidity: {
        compilers: [
            { version: "0.8.18" },
            { version: "0.7.3" },
            { version: "0.8.7" },
            { version: "0.4.24" },
            { version: "0.8.4" },
            { version: "0.8.5" },
            { version: "0.8.0" },
            { version: "0.8.1" },
            { version: "0.8.6" },
            { version: "0.8.8" },
            { version: "0.8.9" },
            { version: "0.8.10" },
            { version: "0.8.11" },
            { version: "0.8.12" },
            { version: "0.8.13" },
            { version: "0.8.14" },
            { version: "0.8.15" },
            { version: "0.8.16" },
            { version: "0.8.17" },
        ],
    },
    namedAccounts: { deployer: { default: 0 }, player: { default: 1 } },
    mocha: { timeout: 1000000 },
}
