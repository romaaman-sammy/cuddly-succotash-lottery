const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const{developmentChains,networkConfig}=require("../../helper-hardhat-config")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { assert,expect } = require("chai")

!developmentChains.includes(network.name)?describe.skip
:describe("Raffle Unit Test",async()=>{
    let lottery,vrfCoordinatorV2Mock,entranceFee,deployer,interval
    const chainId =network.config.chainId


    beforeEach(async()=>{
        deployer=(await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        lottery = await ethers.getContract("Lottery",deployer)
        vrfCoordinatorV2Mock =await ethers.getContract("VRFCoordinatorV2Mock",deployer)
   entranceFee = await lottery.getEntranceFee()
   interval = await lottery.getInterval()
    })
    describe("constructor",async()=>{
        it("initializes the lottery correctly",async()=>{
            const lotteryState = await lottery.getLotteryState()
            const interval = await lottery.getInterval()
            assert.equal(lotteryState.toString(),"0")
            assert.equal(interval.toString(),networkConfig[chainId]["interval"])
        })
    })
    describe("enter lottery",async()=>{
        it("reverts when ETH Amount is not matched to entranceFee",async()=>{
await expect(lottery.enterLottery()).to.be.revertedWith("Lottery__NotEnoughETHEntered")
        })
        it("records players when they enter",async()=>{
await lottery.enterLottery({value:entranceFee})
const playerFromContract=await lottery.getPlayer(0)
assert.equal(playerFromContract,deployer)
        })
        it("emits an event when we enter",async()=>{
            await expect(lottery.enterLottery({value:entranceFee})).to.emit(lottery,"LotteryEnter")
        })
        it("doesnt allow entry to lottery if state is calculating",async()=>{
            await lottery.enterLottery({value:entranceFee})
            /*increase time of our blockchain*/
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
       /*mine the new block to move forward*/
       await network.provider.send("evm_mine",[])
       await lottery.performUpkeep([])
       await expect(lottery.enterLottery({value:entranceFee})).to.be.revertedWith("Lottery__NotOpen")
        })     
    })
    describe("checkUpkeep",async()=>{
        it("returns false if people haven't sent any ETH",async()=>{
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const {upkeepNeeded}=await lottery.callStatic.checkUpkeep([])
assert(!upkeepNeeded)
        })
        it("returns false if lottery is not open",async()=>{
            await lottery.enterLottery({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            await lottery.performUpkeep([])
            const lotteryState=await lottery.getLotteryState()
            const{upkeepNeeded}=await lottery.callStatic.checkUpkeep([])
            assert.equal(lotteryState.toString(),"1")
            assert.equal(upkeepNeeded,false)
        })
        it("returns false if enough time hasn't passed",async()=>{
            await lottery.enterLottery({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()-1])
            await network.provider.request({method:"evm_mine",params:[]})
            const {upkeepNeeded}=await lottery.callStatic.checkUpkeep("0x")
            assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed,has players,eth and is open",async()=>{
            await lottery.enterLottery({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.request({method:"evm_mine",params:[]})
            const{upkeepNeeded}=await lottery.callStatic.checkUpkeep("0x")
            assert(upkeepNeeded)

        })

    })
    describe("performUpkeep",function(){
        it("it can only run if checkUpkeep is true",async()=>{
            await lottery.enterLottery({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const tx =await lottery.performUpkeep([])
            assert(tx)
        })
        it("reverts when checkUpkeep is false",async()=>
        {
            await expect(lottery.performUpkeep([])).to.be.revertedWith("Lottery__UpkeepNotNeeded")
        })
        it("updates the lottery state emits an event and calls the vrfCoordinator",async()=>{
            await lottery.enterLottery({value:entranceFee})
            await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
            await network.provider.send("evm_mine",[])
            const txResponse =await lottery.performUpkeep([])
            const txReceipt = await txResponse.wait(1)
            const requestId=txReceipt.events[1].args.requestId
            const lotteryState=await lottery.getLotteryState()
            assert(requestId.toNumber()>0)
            assert(lotteryState.toNumber()==1)

        })
    })
    describe("fulfillRandomWords",async()=>{
beforeEach(async()=>{
    await lottery.enterLottery({value:entranceFee})
    await network,provider.send("evm_increaseTime",[interval.toNumber]+1)
    await network.provider.send("evm_mine",[])
})
it("can only be called after performUpkeep",async()=>{
    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0,lottery.address)).to.be.revertedWith("non-existent request")
    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1,lottery.address)).to.be.revertedWith("non-existent request") 
})
it("picks a winner resets lottery and sends money",async()=>{
    const additionalEntries = 3
    const startingAccountIndex =1 
    const accounts=await ethers.getSigners()
    for(let i =startingAccountIndex;i<startingAcountIndex+additionalEntries;i++){
        const accountConnectedLottery=lottery.connect(accounts[i])
        await accountConnectedLottery.enterLottery({value:entranceFee})
    }
    const startingTimeStamp =await lottery.getLatestTimeStamp()
    //perform upkeep mock keepers
    //fulfill random words mock vrf
    await new Promise(async(resolve,reject)=>{
        lottery.once("WinnerPicked",async()=>{
            console.log("found the event!")
            
            try{
                const recentWinner=await lottery.getRecentWinner()
                console.log(recentWinner)
                console.log(accounts[3].address)
                console.log(accounts[2].address)
                console.log(accounts[1].address)
                console.log(accounts[0].address)
                
                const lotteryState=await lottery.getLotteryState()
                const endingTimeStamp =await lottery.getLatestTimeStamp()
                const numPlayers=await lottery.getNumberOfPlayers()
                const winnerEndingBalance=await accounts[1].getBalance()
                assert.equal(numPlayers.toString(),"0")
                assert.equal(lotteryState.toString(),"0")
                assert(endingTimeStamp>startingTimeStamp)

                assert.equal(winnerEndingBalance.toString(),winnerStartingBalance.add(entranceFee.mul(additionalEntries).add(entranceFee)).toString())


            }catch(e){
                reject(e)
            
            }resolve()

        })
        //setting up the listener
        //below will fire the event whereby the listener picks it up and resolves
        const tx=await lottery.performUpkeep([])
        const txReceipt=await tx.wait(1)
        const winnerStartingBalance = await accounts[1].getBalance()
        await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId,lottery.address)

    })
})
    
})
})

