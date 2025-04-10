// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";
import {Script, console} from "forge-std/Script.sol";
import {ChitChat} from "../src/ChitChat.sol";

contract MockSimulate is Script {
    address contractAddress =
        DevOpsTools.get_most_recent_deployment("ChitChat", block.chainid);

    ChitChat chitChat = ChitChat(contractAddress);

    uint256[] private keys = [
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d,
        0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a,
        0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6,
        0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a,
        0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba,
        0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e,
        0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356,
        0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97,
        0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
    ];

    // Generate a public key from a private key using signature recovery
    function getPublicKeyFromPrivate(
        uint256 privateKey
    ) internal pure returns (bytes memory) {
        // Sign a message hash with the private key
        bytes32 messageHash = keccak256("ChitChat Public Key Registration");
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Get the signature components
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            privateKey,
            ethSignedMessageHash
        );

        // For testing purposes, we'll just use the signature itself as a stand-in for the public key
        // In production, you would derive the actual public key
        bytes memory signature = abi.encodePacked(r, s, v);

        return signature;
    }

    function createMultipleAccounts() public {
        for (uint256 i = 0; i < 9; i++) {
            string memory friendName = string(abi.encodePacked("User", i));
            bytes memory publicKey = getPublicKeyFromPrivate(keys[i]);

            vm.startBroadcast(keys[i]);
            // Update with your new function signature that includes public key
            chitChat.createAccount(friendName, "ipfs", publicKey);
            vm.stopBroadcast();
        }
        console.log("Created accounts");
        uint total_address = chitChat.getAllUsers().length;
        console.log("Total address: ", total_address);
    }

    function run() external {
        createMultipleAccounts();
    }
}
