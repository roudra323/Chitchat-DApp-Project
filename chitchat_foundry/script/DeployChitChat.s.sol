// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ChitChat} from "../src/ChitChat.sol";

contract DeployChitChat is Script {
    function run() external returns (ChitChat chitChat) {
        vm.startBroadcast();
        chitChat = new ChitChat();
        console.log("ChitChat contract deployed at:", address(chitChat));
        vm.stopBroadcast();
    }
}
