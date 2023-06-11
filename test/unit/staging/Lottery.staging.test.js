const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../../helper-hardhat-config")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", function () {
          let lottery, entranceFee, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              /*await deployments.fixture(["all"])*/
              lottery = await ethers.getContract("Lottery", deployer)
              entranceFee = await lottery.getEntranceFee()
          })
          describe("fulfill randomWords", function () {
              it("works with live network chainlink keepers and vrf to get a random winner", async () => {
                  //enter the lottery
                  console.log("setting up test")
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  //setup listener before we enter the lottery ,as new blocks may be mined fast
                  console.log("setting up listener")
                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("winner picked event fired")

                          try {
                              //add the asserts here
                              const recentWinner = await lottery.getRecentWinner()
                              const lotteryState = await lottery.getLotteryState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()

                              await expect(lottery.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(lotteryState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(entranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      //enter the lottery
                      const tx = await lottery.enterLottery({ value: entranceFee })
                      await tx.wait(1)
                      console.log("ok time to wait")
                      const winnerStartingBalance = await accounts[0].getBalance()
                      //this code will not complete until our listener triggers the event and fulfils promise
                  })
              })
          })
      })
