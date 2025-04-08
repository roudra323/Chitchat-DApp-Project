// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ChitChat
/// @author roudra323
/// @notice A decentralized encrypted messaging platform using IPFS and symmetric key sharing.
/// @dev All messages are encrypted off-chain and stored on IPFS. Symmetric keys are shared securely on-chain.

contract ChitChat {
    /// @notice Friend struct holding user address and display name
    struct Friend {
        address addr;
        string name;
    }

    /// @notice IPFS metadata for encrypted messages or profile pictures
    struct IPFSMetadata {
        string contentCID;
        uint256 uploadedAt;
        bool isEncrypted;
    }

    /// @notice Enum for friend request status
    enum RequestStatus {
        None,
        Sent,
        Accepted,
        Rejected
    }

    /// @notice User profile with name, profile picture, friends, friend requests, and encrypted messages
    struct UserProfile {
        string name;
        IPFSMetadata profilePicture;
        mapping(address => bool) friends;
        mapping(address => RequestStatus) friendRequests;
        mapping(address => IPFSMetadata[]) encryptedMessageHistory;
    }

    // === State Variables ===

    mapping(address => UserProfile) private users;
    mapping(address => mapping(address => bytes)) public sharedSymmetricKeys;
    mapping(address => bytes) public userPublicKeys;
    address[] private registeredUsers;

    // === Events ===

    event UserRegistered(
        address indexed user,
        string indexed name,
        string ipfsHash,
        uint256 indexed timestamp
    );
    event FriendRequestSent(
        address indexed sender,
        address indexed receiver,
        uint256 indexed timestamp
    );
    event FriendRequestAccepted(
        address indexed sender,
        address indexed receiver,
        uint256 indexed timestamp
    );
    event ProfilePictureUpdated(address indexed user, string indexed ipfsHash);
    event EncryptedMessageStored(
        address indexed sender,
        address indexed receiver,
        string ipfsHash
    );
    event SymmetricKeyShared(
        address indexed sender,
        address indexed receiver,
        uint256 indexed timestamp
    );

    event FriendRequestRejected(
        address indexed sender,
        address indexed receiver,
        uint256 indexed timestamp
    );
    event FriendRemoved(
        address indexed user,
        address indexed friend,
        uint256 indexed timestamp
    );

    // === Modifiers ===

    /// @dev Reverts if the user is not registered
    modifier userExists(address _addr) {
        require(bytes(users[_addr].name).length > 0, "User not registered");
        _;
    }

    // === Core User Functions ===

    /// @notice Registers a new user with a display name
    /// @param _name The display name of the user
    function createAccount(
        string calldata _name,
        string memory _contentCID,
        bytes calldata _publicKey
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(
            bytes(users[msg.sender].name).length == 0,
            "Account already exists"
        );
        require(
            bytes(_contentCID).length > 0,
            "IPFS content hash cannot be empty"
        );

        users[msg.sender].name = _name;
        registeredUsers.push(msg.sender);

        users[msg.sender].profilePicture = IPFSMetadata({
            contentCID: _contentCID,
            uploadedAt: block.timestamp,
            isEncrypted: false
        });

        userPublicKeys[msg.sender] = _publicKey;
        emit UserRegistered(msg.sender, _name, _contentCID, block.timestamp);
    }

    /// @notice Updates the profile picture using an IPFS hash
    /// @param _ipfsHash The IPFS content hash
    function updateProfilePicture(
        string memory _ipfsHash
    ) external userExists(msg.sender) {
        users[msg.sender].profilePicture = IPFSMetadata({
            contentCID: _ipfsHash,
            uploadedAt: block.timestamp,
            isEncrypted: false
        });

        emit ProfilePictureUpdated(msg.sender, _ipfsHash);
    }

    /// @notice Returns a user's profile picture metadata
    /// @param _user The address of the user
    function getProfilePicture(
        address _user
    ) external view userExists(_user) returns (IPFSMetadata memory) {
        return users[_user].profilePicture;
    }

    // === Friend System ===

    /// @notice Sends a friend request to another user
    /// @param _recipient The address of the user to add
    function sendFriendRequest(
        address _recipient
    ) external userExists(msg.sender) userExists(_recipient) {
        require(msg.sender != _recipient, "Cannot send request to yourself");
        require(!users[msg.sender].friends[_recipient], "Already friends");
        require(
            users[msg.sender].friendRequests[_recipient] == RequestStatus.None,
            "Request already sent"
        );

        users[msg.sender].friendRequests[_recipient] = RequestStatus.Sent;
        users[_recipient].friendRequests[msg.sender] = RequestStatus.Sent;

        emit FriendRequestSent(msg.sender, _recipient, block.timestamp);
    }

    /// @notice Accepts a friend request
    /// @param _sender The address of the sender of the friend request
    function acceptFriendRequest(
        address _sender
    ) external userExists(msg.sender) userExists(_sender) {
        require(
            users[_sender].friendRequests[msg.sender] == RequestStatus.Sent,
            "No pending request"
        );

        users[msg.sender].friends[_sender] = true;
        users[_sender].friends[msg.sender] = true;

        users[msg.sender].friendRequests[_sender] = RequestStatus.Accepted;
        users[_sender].friendRequests[msg.sender] = RequestStatus.Accepted;

        emit FriendRequestAccepted(_sender, msg.sender, block.timestamp);
    }

    /// @notice Rejects a friend request
    /// @param _sender The address of the sender of the friend request
    function rejectFriendRequest(
        address _sender
    ) external userExists(msg.sender) userExists(_sender) {
        require(
            users[_sender].friendRequests[msg.sender] == RequestStatus.Sent,
            "No pending request"
        );

        users[msg.sender].friendRequests[_sender] = RequestStatus.Rejected;
        users[_sender].friendRequests[msg.sender] = RequestStatus.Rejected;

        emit FriendRequestRejected(_sender, msg.sender, block.timestamp);
    }

    /// @notice Removes a friend from the user's friend list
    /// @param _friend The address of the friend to remove
    function removeFriend(
        address _friend
    ) external userExists(msg.sender) userExists(_friend) {
        require(users[msg.sender].friends[_friend], "Not friends");

        // Remove the friend relationship
        users[msg.sender].friends[_friend] = false;
        users[_friend].friends[msg.sender] = false;

        // Reset friend request status
        users[msg.sender].friendRequests[_friend] = RequestStatus.None;
        users[_friend].friendRequests[msg.sender] = RequestStatus.None;

        emit FriendRemoved(msg.sender, _friend, block.timestamp);
    }

    /// @notice Returns all friends of the caller
    function getFriends()
        external
        view
        userExists(msg.sender)
        returns (Friend[] memory)
    {
        Friend[] memory friends = new Friend[](registeredUsers.length);
        uint256 count = 0;

        for (uint256 i = 0; i < registeredUsers.length; i++) {
            address userAddr = registeredUsers[i];
            if (users[msg.sender].friends[userAddr]) {
                friends[count] = Friend({
                    addr: userAddr,
                    name: users[userAddr].name
                });
                count++;
            }
        }

        assembly {
            mstore(friends, count)
        }

        return friends;
    }

    /// @notice Returns all registered users
    function getAllUsers() external view returns (address[] memory) {
        return registeredUsers;
    }

    /**
     * @notice Checks if the specified address is a friend of the caller.
     * @dev The caller must be a registered user.
     * @param _friend The address of the friend to check.
     * @return bool Returns true if the specified address is a friend, otherwise false.
     */
    function isFriend(
        address _friend
    ) external view userExists(msg.sender) returns (bool) {
        return users[msg.sender].friends[_friend];
    }

    /**
     * @notice Retrieves the friend request status for the specified address.
     * @dev The caller must be a registered user.
     * @param _friend The address of the friend whose request status is being checked.
     * @return RequestStatus The status of the friend request (e.g., Pending, Accepted, Rejected).
     */
    function friendRequestStatus(
        address _friend
    ) external view userExists(msg.sender) returns (RequestStatus) {
        return users[msg.sender].friendRequests[_friend];
    }

    /**
     * @notice Checks if a user is registered in the system.
     * @param _user The address of the user to check.
     * @return bool Returns true if the user is registered, otherwise false.
     */
    function isUserRegistered(address _user) external view returns (bool) {
        return bytes(users[_user].name).length > 0;
    }

    /**
     * @notice Retrieves the user information for the specified address.
     * @param _user The address of the user whose information is being retrieved.
     * @return name The name of the user.
     * @return ipfsHash The IPFS hash of the user's profile picture.
     */
    function getUserInfo(
        address _user
    ) external view returns (string memory name, string memory ipfsHash) {
        name = users[_user].name;
        ipfsHash = users[_user].profilePicture.contentCID;
    }

    // === Messaging ===

    /// @notice Sends an encrypted message reference stored on IPFS
    /// @param _recipient The address of the recipient
    /// @param _encryptedMessageHash The IPFS hash of the encrypted message
    function sendEncryptedMessage(
        address _recipient,
        string memory _encryptedMessageHash
    ) external userExists(msg.sender) userExists(_recipient) {
        require(users[msg.sender].friends[_recipient], "Not friends");
        require(isKeyExchanged(_recipient), "Symmetric key not shared");

        IPFSMetadata memory metadata = IPFSMetadata({
            contentCID: _encryptedMessageHash,
            uploadedAt: block.timestamp,
            isEncrypted: true
        });

        users[msg.sender].encryptedMessageHistory[_recipient].push(metadata);
        users[_recipient].encryptedMessageHistory[msg.sender].push(metadata);

        emit EncryptedMessageStored(
            msg.sender,
            _recipient,
            _encryptedMessageHash
        );
    }

    /// @notice Returns encrypted message history with a friend
    /// @param _friend The friend's address
    function getEncryptedMessageHistory(
        address _friend
    )
        external
        view
        userExists(msg.sender)
        userExists(_friend)
        returns (IPFSMetadata[] memory)
    {
        require(users[msg.sender].friends[_friend], "Not friends");
        return users[msg.sender].encryptedMessageHistory[_friend];
    }

    // === Symmetric Key Sharing ===

    /// @notice Shares an encrypted symmetric key with a friend
    /// @param _friend The friend's address
    /// @param _encryptedKey The encrypted key (encrypted with friend's public key off-chain)
    function shareSymmetricKey(
        address _friend,
        bytes calldata _encryptedKey
    ) external userExists(msg.sender) userExists(_friend) {
        require(users[msg.sender].friends[_friend], "Not friends");
        require(_encryptedKey.length > 0, "Empty key data");

        sharedSymmetricKeys[msg.sender][_friend] = _encryptedKey;

        emit SymmetricKeyShared(msg.sender, _friend, block.timestamp);
    }

    /// @notice Returns the encrypted symmetric key shared by a friend
    /// @param _friend The address of the friend who shared the key
    function getSharedKeyFrom(
        address _friend
    )
        external
        view
        userExists(msg.sender)
        userExists(_friend)
        returns (bytes memory)
    {
        return sharedSymmetricKeys[_friend][msg.sender];
    }

    /**
     * @notice Checks if a symmetric key has been exchanged between the caller and a specified friend.
     * @dev This function verifies if either the caller or the specified friend has shared a symmetric key
     *      with the other. It ensures that both the caller and the friend exist as users in the system.
     * @param _friend The address of the friend to check for key exchange.
     * @return bool Returns true if a symmetric key has been exchanged between the caller and the friend,
     *              otherwise returns false.
     */
    function isKeyExchanged(
        address _friend
    ) public view userExists(msg.sender) userExists(_friend) returns (bool) {
        // Check if either user has shared a key with the other
        return
            sharedSymmetricKeys[msg.sender][_friend].length > 0 ||
            sharedSymmetricKeys[_friend][msg.sender].length > 0;
    }

    /**
     * @notice Retrieves the public key of a specified user.
     * @dev This function allows external contracts or users to access the stored public key
     *      associated with a given user's address.
     * @param _user The address of the user whose public key is being requested.
     * @return The public key of the specified user as a bytes array.
     */
    function getUserPublicKey(
        address _user
    ) external view returns (bytes memory) {
        return userPublicKeys[_user];
    }
}
