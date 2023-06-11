//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
error Lottery__NotEnoughETHEntered();
error Lottery__TransferFailed();
error Lottery__NotOpen();
error Lottery__InCalculatingState();
error Lottery__UpkeepNotNeeded(uint256 currentBalance,uint256 numPlayers,uint256 lotteryState);

contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /*Type declarations */
    enum LotteryState {
        OPEN,
        CALCULATING
        //UINT256, 0=OPEN 1=CALCULATING
    }

    /* state variables*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFRIMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //Lottery Variables
    address private s_recentWinner;
    /*uint256 private s_state;*/
    LotteryState private s_lotteryState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /*Events*/
    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

   

    constructor(
        address vrfCoordinatorV2,//contract
        uint256 entranceFee,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;

        //address vrfCoordinatorV2,
        //VRFConsumerBaseV2(vrfCoordinatorV2)
    }

    function enterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughETHEntered();
        }
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }

        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    /**
     * @dev The func that the chainlink keepr nodes call when they look for the
     * upKeepNeeded to return true
     * The following should be true inorder to return random number or(perform upkeep)
     * To be true 1.our time interval should have passed
     * 2.The lottery should have at least one player and have some ETH
     * 3.Our subscription is funded with LINK
     * 4.The lottery should be in an open state
     */

    function checkUpkeep(
        bytes memory /*checkData*/
    ) public override returns (bool upkeepNeeded, bytes memory /*perform data*/) {
        bool isOpen = (LotteryState.OPEN == s_lotteryState);
        //block.timestamp -last block timestamp>interval
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    //chainlink keepers implementation so it can be automated
    function performUpkeep(bytes calldata/*perform data*/) external override{
        (bool upkeepNeeded, )=checkUpkeep("");
        if(!upkeepNeeded){
            revert Lottery__UpkeepNotNeeded(address(this).balance,s_players.length,uint256(s_lotteryState));
        }
        //if statements to stop people from joining a calculating lottery
        s_lotteryState = LotteryState.CALCULATING;

        //Request the random number
        //Use the random number
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash, //gas lane
            i_subscriptionId,
            REQUEST_CONFRIMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedLotteryWinner(requestId);
    }

    function fulfillRandomWords(
        uint256,
        /*requestId,*/ uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        //once calculating state is through
        s_lotteryState = LotteryState.OPEN;
        //after picking winner reset players array
        s_players = new address payable[](0);
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
       //reset the timestamp
        s_lastTimeStamp=block.timestamp;
        //require success
        if (!success) {
            revert Lottery__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /*View /Pure functions*/

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
    function getLotteryState()public view returns(LotteryState){
        return s_lotteryState;
    }
    function getNumWords()public pure returns(uint256){
        return NUM_WORDS;

    }
    function getNumberOfPlayers()public view returns(uint256){
        return s_players.length;
    }
    function getLatestTimeStamp()public view returns(uint256){
        return s_lastTimeStamp;
    }
    function getRequestConfirmations()public pure returns(uint16){
        return REQUEST_CONFRIMATIONS;

    }
    function getInterval()public view returns(uint256){
        return i_interval;
    }
}
