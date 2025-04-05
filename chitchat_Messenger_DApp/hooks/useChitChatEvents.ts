import { useEffect, useState } from "react";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { ethers } from "ethers";

// Define types for event data
interface RelationshipEvent {
    sender: string;
    receiver: string;
    timestamp: string;
    status: 'pending' | 'accepted' | 'rejected';
}

interface MessageEvent {
    sender: string;
    receiver: string;
    ipfsHash: string;
}

interface UserRegistrationEvent {
    user: string;
    name: string;
    ipfsHash: string;
    timestamp: string;
}

interface ProcessedEvents {
    pending: RelationshipEvent[];
    accepted: RelationshipEvent[];
}


type EventWithType = {
    type: 'sent' | 'accepted' | 'rejected' | 'removed';
    event: ethers.Event;
}

// Custom hook to listen for ChitChat contract events
export function useChitChatEvents() {
    const { contracts } = useEthersWithRainbow();
    const [friendRequests, setFriendRequests] = useState<RelationshipEvent[]>([]);
    const [acceptedFriends, setAcceptedFriends] = useState<RelationshipEvent[]>([]);
    const [userRegistrations, setUserRegistrations] = useState<UserRegistrationEvent[]>([]);
    const [messageEvents, setMessageEvents] = useState<MessageEvent[]>([]);

    // Load initial state and set up listeners
    useEffect(() => {
        if (!contracts?.chitChat) return;

        const loadInitialState = async () => {
            try {
                // Contract Instance
                const chitChatContract = contracts?.chitChat;
                // Get past events to build initial state
                const pastFriendRequests = await chitChatContract?.queryFilter(
                    chitChatContract?.filters.FriendRequestSent()
                );

                console.log("pastFriendRequests", pastFriendRequests);

                const pastAcceptedRequests = await chitChatContract?.queryFilter(
                    chitChatContract?.filters.FriendRequestAccepted()
                );

                const pastRejectedRequests = await chitChatContract?.queryFilter(
                    chitChatContract?.filters.FriendRequestRejected()
                );

                const pastRemovedFriends = await chitChatContract?.queryFilter(
                    chitChatContract?.filters.FriendRemoved()
                );

                // Process events to build a consistent state
                const processedRequests = processRequestEvents(
                    pastFriendRequests || [],
                    pastAcceptedRequests || [],
                    pastRejectedRequests || [],
                    pastRemovedFriends || []
                );

                setFriendRequests(processedRequests.pending);
                setAcceptedFriends(processedRequests.accepted);

                // Set up listeners for new events
                setupEventListeners();
            } catch (error) {
                console.error("Error loading initial contract state:", error);
            }
        };

        loadInitialState();

        // Cleanup listeners on unmount
        return () => {
            if (contracts?.chitChat) {
                contracts.chitChat.removeAllListeners();
            }
        };
    }, [contracts?.chitChat]);

    // Process events to build a consistent state
    function processRequestEvents(
        sentEvents: ethers.Event[],
        acceptedEvents: ethers.Event[],
        rejectedEvents: ethers.Event[],
        removedEvents: ethers.Event[]
    ): ProcessedEvents {
        const pending: RelationshipEvent[] = [];
        const accepted: RelationshipEvent[] = [];
        const rejected: RelationshipEvent[] = [];

        // Map to track the latest state of each relationship
        const relationshipState = new Map<string, RelationshipEvent>();

        // Process all events chronologically to build the final state
        const allEvents: EventWithType[] = [
            ...sentEvents.map(e => ({ type: 'sent' as const, event: e })),
            ...acceptedEvents.map(e => ({ type: 'accepted' as const, event: e })),
            ...rejectedEvents.map(e => ({ type: 'rejected' as const, event: e })),
            ...removedEvents.map(e => ({ type: 'removed' as const, event: e }))
        ].sort((a, b) => {
            const aTimestamp = a.event.args?.timestamp ? Number(a.event.args.timestamp.toString()) : 0;
            const bTimestamp = b.event.args?.timestamp ? Number(b.event.args.timestamp.toString()) : 0;
            return aTimestamp - bTimestamp;
        });

        for (const { type, event } of allEvents) {
            if (!event.args) continue;

            const sender = event.args.sender as string;
            const receiver = event.args.receiver as string;
            const timestamp = event.args.timestamp?.toString() || "0";
            const key = `${sender}-${receiver}`;
            const reverseKey = `${receiver}-${sender}`;

            switch (type) {
                case 'sent':
                    relationshipState.set(key, { status: 'pending', sender, receiver, timestamp });
                    relationshipState.set(reverseKey, { status: 'pending', sender, receiver, timestamp });
                    break;
                case 'accepted':
                    relationshipState.set(key, { status: 'accepted', sender, receiver, timestamp });
                    relationshipState.set(reverseKey, { status: 'accepted', sender, receiver, timestamp });
                    break;
                case 'rejected':
                    relationshipState.set(key, { status: 'rejected', sender, receiver, timestamp });
                    relationshipState.set(reverseKey, { status: 'rejected', sender, receiver, timestamp });
                    break;
                case 'removed':
                    relationshipState.delete(key);
                    relationshipState.delete(reverseKey);
                    break;
            }
        }

        // Build final arrays based on the relationship state map
        for (const [_, relationship] of relationshipState.entries()) {
            if (relationship.status === 'pending') {
                pending.push(relationship);
            } else if (relationship.status === 'accepted') {
                accepted.push(relationship);
            }
            // We don't track rejected requests in the UI
        }

        // Remove duplicates (since each relationship appears twice in the map)
        const uniquePending = removeDuplicateRelationships(pending);
        const uniqueAccepted = removeDuplicateRelationships(accepted);

        return {
            pending: uniquePending,
            accepted: uniqueAccepted
        };
    }

    // Helper to remove duplicate relationships
    function removeDuplicateRelationships(relationships: RelationshipEvent[]): RelationshipEvent[] {
        const seen = new Set<string>();
        return relationships.filter(rel => {
            const key1 = `${rel.sender}-${rel.receiver}`;
            const key2 = `${rel.receiver}-${rel.sender}`;
            if (seen.has(key1) || seen.has(key2)) {
                return false;
            }
            seen.add(key1);
            seen.add(key2);
            return true;
        });
    }

    // Set up listeners for real-time updates
    function setupEventListeners() {
        if (!contracts?.chitChat) return;

        // Listen for new friend requests
        contracts.chitChat.on("FriendRequestSent",
            (sender: string, receiver: string, timestamp: ethers.BigNumberish) => {
                setFriendRequests(prev => {
                    // Check if this request already exists
                    if (prev.some(req => req.sender === sender && req.receiver === receiver)) {
                        return prev;
                    }
                    return [...prev, {
                        sender,
                        receiver,
                        timestamp: timestamp.toString(),
                        status: 'pending'
                    }];
                });
            }
        );

        // Listen for accepted friend requests
        contracts.chitChat.on("FriendRequestAccepted",
            (sender: string, receiver: string, timestamp: ethers.BigNumberish) => {
                // Update friend requests - remove the accepted one
                setFriendRequests(prev =>
                    prev.filter(req => !(
                        (req.sender === sender && req.receiver === receiver) ||
                        (req.sender === receiver && req.receiver === sender)
                    ))
                );

                // Add to accepted friends
                setAcceptedFriends(prev => {
                    if (prev.some(friend =>
                        (friend.sender === sender && friend.receiver === receiver) ||
                        (friend.sender === receiver && friend.receiver === sender)
                    )) {
                        return prev;
                    }
                    return [...prev, {
                        sender,
                        receiver,
                        timestamp: timestamp.toString(),
                        status: 'accepted'
                    }];
                });
            }
        );

        // Listen for rejected friend requests
        contracts.chitChat.on("FriendRequestRejected",
            (sender: string, receiver: string, timestamp: ethers.BigNumberish) => {
                // Remove rejected requests from pending
                setFriendRequests(prev =>
                    prev.filter(req => !(
                        (req.sender === sender && req.receiver === receiver) ||
                        (req.sender === receiver && req.receiver === sender)
                    ))
                );
            }
        );

        // Listen for removed friends
        contracts.chitChat.on("FriendRemoved",
            (user: string, friend: string, timestamp: ethers.BigNumberish) => {
                // Remove from accepted friends
                setAcceptedFriends(prev =>
                    prev.filter(f => !(
                        (f.sender === user && f.receiver === friend) ||
                        (f.sender === friend && f.receiver === user)
                    ))
                );
            }
        );

        // Listen for new messages
        contracts.chitChat.on("EncryptedMessageStored",
            (sender: string, receiver: string, ipfsHash: string) => {
                setMessageEvents(prev => [...prev, { sender, receiver, ipfsHash }]);
            }
        );

        // Listen for user registrations
        contracts.chitChat.on("UserRegistered",
            (user: string, name: string, ipfsHash: string, timestamp: ethers.BigNumberish) => {
                setUserRegistrations(prev => [...prev, {
                    user,
                    name,
                    ipfsHash,
                    timestamp: timestamp.toString()
                }]);
            }
        );
    }

    return {
        friendRequests,
        acceptedFriends,
        userRegistrations,
        messageEvents
    };
}