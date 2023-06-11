const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")

const BASE_FEE = ethers.utils.parseEther("0.25") //cost is 0.25LINK per fulfill random number request
const GAS_PRICE_LINK = 1e9 //link/gas//calculated value based on the gas price of the chain
//chainlink nodes pay the gas fees as they perform external execution & respond to give us randomness
//the price of requests changes based on price of gas

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected...deploying mocks...")
        //deploy a mockvrfcoordinatorv2
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed")
        log("__ __ __ __ __ __")
    }
}
module.exports.tags = ["all", "mocks"]
