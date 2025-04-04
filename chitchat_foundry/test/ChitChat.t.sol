// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {ChitChat} from "src/ChitChat.sol";
import {DeployChitChat} from "script/DeployChitChat.s.sol";

contract ChitChatTest is Test {
    ChitChat chitChat;

    function setUp() public {
        DeployChitChat deployer = new DeployChitChat();
        chitChat = deployer.run();
    }

    function test_returnsZeroAsThereIsNoUserInitially() public view {
        uint256 totalusers = chitChat.getAllUsers().length;
        assertEq(totalusers, 0);
    }

    function test_registerUser() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.startPrank(user);
        chitChat.createAccount(name);
        vm.stopPrank();

        address[] memory allUsers = chitChat.getAllUsers();
        assertEq(allUsers.length, 1);
        assertEq(allUsers[0], user);
    }

    function test_registerMultipleUsers() public {
        uint256 totalUsers = 10;

        for (uint256 i = 0; i < totalUsers; i++) {
            address user = address(uint160(i + 1));
            string memory name = string(abi.encodePacked("User", i));

            vm.prank(user);
            chitChat.createAccount(name);
        }

        address[] memory allUsers = chitChat.getAllUsers();
        assertEq(allUsers.length, totalUsers);
    }

    function test_sendFriendRequest() public {
        address user1 = vm.addr(1);
        address user2 = vm.addr(2);
        string memory name1 = "Alice";
        string memory name2 = "Bob";

        vm.prank(user1);
        chitChat.createAccount(name1);

        vm.prank(user2);
        chitChat.createAccount(name2);

        // Set up event expectations
        // Parameters: check topic1, check topic2, check topic3, check data
        vm.expectEmit(true, true, false, false);
        // Emit the expected event
        emit ChitChat.FriendRequestSent(user1, user2);

        // Perform the action that should emit the event
        vm.prank(user1);
        chitChat.sendFriendRequest(user2);
    }

    function test_sendAndAcceptMultipleFriendRequests() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(friendName);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestAccepted(user, friend);

            vm.prank(friend);
            chitChat.acceptFriendRequest(user);
        }

        vm.prank(user);
        uint256 totalFriends = chitChat.getFriends().length;
        assertEq(totalFriends, 10);
    }

    function test_sendAndRejectMultipleFriendRequests() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(friendName);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestRejected(user, friend);

            vm.prank(friend);
            chitChat.rejectFriendRequest(user);
        }

        vm.prank(user);
        uint256 totalFriends = chitChat.getFriends().length;
        assertEq(totalFriends, 0);
    }

    function test_removeMultipleFriends() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(friendName);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRequestAccepted(user, friend);

            vm.prank(friend);
            chitChat.acceptFriendRequest(user);

            // remove friends
            vm.expectEmit(true, true, false, false);
            // Emit the expected event
            emit ChitChat.FriendRemoved(user, friend);
            vm.prank(user);
            chitChat.removeFriend(friend);
        }

        vm.prank(user);
        uint256 totalFriends = chitChat.getFriends().length;
        assertEq(totalFriends, 0);
    }
}
