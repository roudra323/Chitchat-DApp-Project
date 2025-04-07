// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {ChitChat} from "src/ChitChat.sol";
import {DeployChitChat} from "script/DeployChitChat.s.sol";

contract ChitChatTest is Test {
    ChitChat chitChat;

    // Sample IPFS content hash and public key
    string constant SAMPLE_IPFS_HASH =
        "QmT8e5oWmyyM61gnjv5dRx5L5BZ4xzFsgEU4u7kGPB87nS";
    bytes constant SAMPLE_PUBLIC_KEY =
        "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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
        chitChat.createAccount(name, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);
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
            chitChat.createAccount(name, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);
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
        chitChat.createAccount(name1, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        vm.prank(user2);
        chitChat.createAccount(name2, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        // Set up event expectations
        // Parameters: check topic1, check topic2, check topic3, check data
        vm.expectEmit(true, true, true, false);
        // Emit the expected event - note timestamp is now included
        emit ChitChat.FriendRequestSent(user1, user2, block.timestamp);

        // Perform the action that should emit the event
        vm.prank(user1);
        chitChat.sendFriendRequest(user2);
    }

    function test_sendAndAcceptMultipleFriendRequests() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(
                friendName,
                SAMPLE_IPFS_HASH,
                SAMPLE_PUBLIC_KEY
            );

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend, block.timestamp);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestAccepted(user, friend, block.timestamp);

            vm.prank(friend);
            chitChat.acceptFriendRequest(user);
        }

        vm.prank(user);
        ChitChat.Friend[] memory friends = chitChat.getFriends();
        assertEq(friends.length, 10);
    }

    function test_sendAndRejectMultipleFriendRequests() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(
                friendName,
                SAMPLE_IPFS_HASH,
                SAMPLE_PUBLIC_KEY
            );

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend, block.timestamp);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestRejected(user, friend, block.timestamp);

            vm.prank(friend);
            chitChat.rejectFriendRequest(user);
        }

        vm.prank(user);
        ChitChat.Friend[] memory friends = chitChat.getFriends();
        assertEq(friends.length, 0);
    }

    function test_removeMultipleFriends() public {
        address user = vm.addr(1);
        string memory name = "Alice";

        vm.prank(user);
        chitChat.createAccount(name, SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        for (uint256 i = 0; i < 10; i++) {
            address friend = address(uint160(i + 2));
            string memory friendName = string(abi.encodePacked("User", i));

            vm.prank(friend);
            chitChat.createAccount(
                friendName,
                SAMPLE_IPFS_HASH,
                SAMPLE_PUBLIC_KEY
            );

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestSent(user, friend, block.timestamp);

            vm.prank(user);
            chitChat.sendFriendRequest(friend);

            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRequestAccepted(user, friend, block.timestamp);

            vm.prank(friend);
            chitChat.acceptFriendRequest(user);

            // remove friends
            vm.expectEmit(true, true, true, false);
            // Emit the expected event
            emit ChitChat.FriendRemoved(user, friend, block.timestamp);
            vm.prank(user);
            chitChat.removeFriend(friend);
        }

        vm.prank(user);
        ChitChat.Friend[] memory friends = chitChat.getFriends();
        assertEq(friends.length, 0);
    }

    function test_encryptedMessaging() public {
        address alice = vm.addr(1);
        address bob = vm.addr(2);

        // Register users
        vm.prank(alice);
        chitChat.createAccount("Alice", SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        vm.prank(bob);
        chitChat.createAccount("Bob", SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        // Become friends
        vm.prank(alice);
        chitChat.sendFriendRequest(bob);

        vm.prank(bob);
        chitChat.acceptFriendRequest(alice);

        // Alice shares symmetric key with Bob
        bytes memory encryptedKey = hex"deadbeef";
        vm.prank(alice);
        chitChat.shareSymmetricKey(bob, encryptedKey);

        // Send encrypted message
        string memory messageHash = "QmMessageHash";
        vm.expectEmit(true, true, false, true);
        emit ChitChat.EncryptedMessageStored(alice, bob, messageHash);

        vm.prank(alice);
        chitChat.sendEncryptedMessage(bob, messageHash);

        // Verify message is stored
        vm.prank(alice);
        ChitChat.IPFSMetadata[] memory messages = chitChat
            .getEncryptedMessageHistory(bob);
        assertEq(messages.length, 1);
        assertEq(messages[0].contentCID, messageHash);
        assertTrue(messages[0].isEncrypted);
    }

    function test_profilePictureUpdate() public {
        address user = vm.addr(1);

        // Register user
        vm.prank(user);
        chitChat.createAccount("User", SAMPLE_IPFS_HASH, SAMPLE_PUBLIC_KEY);

        // Update profile picture
        string memory newPicHash = "QmNewProfilePic";
        vm.expectEmit(true, true, false, false);
        emit ChitChat.ProfilePictureUpdated(user, newPicHash);

        vm.prank(user);
        chitChat.updateProfilePicture(newPicHash);

        // Verify profile picture was updated
        vm.prank(user);
        ChitChat.IPFSMetadata memory pic = chitChat.getProfilePicture(user);
        assertEq(pic.contentCID, newPicHash);
        assertFalse(pic.isEncrypted);
    }
}
