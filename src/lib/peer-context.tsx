"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import Peer, { type DataConnection } from "peerjs"
import type { PeerMessage, Player, RoomState, ChatMessage, GameState } from "./types"
import { getOrCreateProfile } from "./storage"
import { createDeck, calculatePoints, getHandType } from "./game-utils"

interface PeerContextType {
    peerId: string | null
    isConnected: boolean
    isHost: boolean
    roomState: RoomState | null
    connections: Map<string, DataConnection>
    sendMessage: (message: PeerMessage) => void
    joinRoom: (hostPeerId: string) => Promise<boolean>
    startGame: () => void
    setReady: (ready: boolean) => void
    sendChat: (message: string) => void
    drawCard: () => void
    stand: () => void
    leaveRoom: () => void
}

const PeerContext = createContext<PeerContextType | null>(null)

export function usePeer() {
    const context = useContext(PeerContext)
    if (!context) throw new Error("usePeer must be used within PeerProvider")
    return context
}

interface PeerProviderProps {
    children: ReactNode
    roomCode: string
    isHost: boolean
}

export function PeerProvider({ children, roomCode, isHost }: PeerProviderProps) {
    const peerRef = useRef<Peer | null>(null)
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map())
    const roomStateRef = useRef<RoomState | null>(null)
    const [peerId, setPeerId] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [roomState, setRoomState] = useState<RoomState | null>(null)
    const [, forceUpdate] = useState({})

    const profile = getOrCreateProfile()
    const profileRef = useRef(profile)

    useEffect(() => {
        roomStateRef.current = roomState
    }, [roomState])

    // Initialize room state for host
    const initializeRoomState = useCallback((): RoomState => {
        return {
            roomCode,
            hostId: profileRef.current.id,
            players: [
                {
                    id: profileRef.current.id,
                    name: profileRef.current.name,
                    avatar: profileRef.current.avatar,
                    cards: [],
                    bet: 0,
                    isDealer: true,
                    isReady: false,
                    isOnline: true,
                },
            ],
            gameState: null,
            messages: [],
        }
    }, [roomCode])

    // Broadcast message to all connections
    const broadcast = useCallback((message: PeerMessage, excludeId?: string) => {
        connectionsRef.current.forEach((conn, id) => {
            if (id !== excludeId && conn.open) {
                conn.send(message)
            }
        })
    }, [])

    // Sync room state to all peers
    const syncRoomState = useCallback(
        (state: RoomState) => {
            const syncMessage: PeerMessage = {
                type: "sync",
                payload: state,
                senderId: profileRef.current.id,
                senderName: profileRef.current.name,
            }
            broadcast(syncMessage)
        },
        [broadcast],
    )

    // Handle incoming messages
    const handleMessage = useCallback(
        (message: PeerMessage) => {
            setRoomState((prevState) => {
                if (!prevState) return prevState

                switch (message.type) {
                    case "join": {
                        const newPlayer = message.payload as Player
                        // Check if player already exists
                        if (prevState.players.some((p) => p.id === newPlayer.id)) {
                            return prevState
                        }
                        const newState = {
                            ...prevState,
                            players: [...prevState.players, { ...newPlayer, isOnline: true }],
                        }
                        if (isHost) {
                            // Schedule sync after state update
                            setTimeout(() => syncRoomState(newState), 0)
                        }
                        return newState
                    }

                    case "leave": {
                        const playerId = message.payload as string
                        const newState = {
                            ...prevState,
                            players: prevState.players.filter((p) => p.id !== playerId),
                        }
                        if (isHost) {
                            setTimeout(() => syncRoomState(newState), 0)
                        }
                        return newState
                    }

                    case "ready": {
                        const { playerId, ready } = message.payload as { playerId: string; ready: boolean }
                        const newState = {
                            ...prevState,
                            players: prevState.players.map((p) => (p.id === playerId ? { ...p, isReady: ready } : p)),
                        }
                        if (isHost) {
                            setTimeout(() => syncRoomState(newState), 0)
                        }
                        return newState
                    }

                    case "chat": {
                        const chatMsg = message.payload as ChatMessage
                        return {
                            ...prevState,
                            messages: [...prevState.messages, chatMsg],
                        }
                    }

                    case "sync": {
                        return message.payload as RoomState
                    }

                    case "start": {
                        return message.payload as RoomState
                    }

                    default:
                        return prevState
                }
            })
        },
        [isHost, syncRoomState],
    )

    const handleMessageRef = useRef(handleMessage)
    useEffect(() => {
        handleMessageRef.current = handleMessage
    }, [handleMessage])

    // Initialize Peer - with better cleanup
    useEffect(() => {
        const currentProfile = profileRef.current
        // Add timestamp to ensure unique ID
        const timestamp = Date.now()
        const peerIdStr = isHost 
            ? `pokdeng-${roomCode}-${timestamp}` 
            : `pokdeng-${roomCode}-${currentProfile.id}-${timestamp}`

        // Try different PeerJS server configurations
        let peer: Peer
        
        try {
            // First try with default configuration
            peer = new Peer(peerIdStr, {
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            })
        } catch (err) {
            console.error("Failed to create Peer instance:", err)
            // Fallback to using a simpler configuration
            peer = new Peer(peerIdStr, { debug: 0 })
        }

        const setupConnectionInternal = (conn: DataConnection) => {
            conn.on("open", () => {
                connectionsRef.current.set(conn.peer, conn)
                forceUpdate({})

                // Send current room state to new peer
                if (isHost && roomStateRef.current) {
                    const syncMessage: PeerMessage = {
                        type: "sync",
                        payload: roomStateRef.current,
                        senderId: currentProfile.id,
                        senderName: currentProfile.name,
                    }
                    conn.send(syncMessage)
                }
            })

            conn.on("data", (data) => {
                try {
                    handleMessageRef.current(data as PeerMessage)
                } catch (err) {
                    console.error("Error handling message:", err)
                }
            })

            conn.on("close", () => {
                connectionsRef.current.delete(conn.peer)
                forceUpdate({})
            })

            conn.on("error", (err) => {
                console.error("[Peer] Connection error:", err)
            })
        }

        peer.on("open", (id) => {
            console.log("[Peer] Connected with ID:", id)
            setPeerId(id)
            setIsConnected(true)

            if (isHost) {
                const initialState = initializeRoomState()
                setRoomState(initialState)
                roomStateRef.current = initialState
            }
        })

        peer.on("connection", (conn) => {
            setupConnectionInternal(conn)
        })

        peer.on("error", (err) => {
            console.error("[Peer] Peer error:", err)
            if (err.type === "unavailable-id") {
                console.log("[Peer] ID unavailable, trying with different ID...")
                setIsConnected(false)
            } else if (err.type === "network" || err.type === "server-error") {
                console.log("[Peer] Network/server error, will retry...")
                setIsConnected(false)
            }
        })

        peer.on("disconnected", () => {
            console.log("[Peer] Disconnected, attempting to reconnect...")
            if (!peer.destroyed) {
                setTimeout(() => {
                    if (!peer.destroyed) {
                        peer.reconnect()
                    }
                }, 1000)
            }
        })

        peerRef.current = peer

        return () => {
            console.log("[Peer] Cleaning up Peer instance...")
            // Close all connections first
            connectionsRef.current.forEach((conn) => {
                conn.close()
            })
            connectionsRef.current.clear()
            
            // Destroy peer
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.destroy()
                peerRef.current = null
            }
        }
    }, [roomCode, isHost, initializeRoomState])

    // Join room (for non-host)
    const joinRoom = useCallback(async (hostPeerId: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!peerRef.current || !peerRef.current.open) {
                console.error("[Peer] Cannot join room: Peer not initialized")
                resolve(false)
                return
            }

            console.log("[Peer] Attempting to join room:", hostPeerId)
            
            try {
                const conn = peerRef.current.connect(hostPeerId, { 
                    reliable: true,
                    serialization: 'json'
                })
                let resolved = false

                const setupJoinConnection = (connection: DataConnection) => {
                    const timeout = setTimeout(() => {
                        if (!resolved) {
                            console.error("[Peer] Connection timeout")
                            resolved = true
                            connection.close()
                            resolve(false)
                        }
                    }, 15000)

                    connection.on("open", () => {
                        clearTimeout(timeout)
                        connectionsRef.current.set(connection.peer, connection)
                        forceUpdate({})

                        // Send join message
                        const joinMessage: PeerMessage = {
                            type: "join",
                            payload: {
                                id: profileRef.current.id,
                                name: profileRef.current.name,
                                avatar: profileRef.current.avatar,
                                cards: [],
                                bet: 0,
                                isDealer: false,
                                isReady: false,
                                isOnline: true,
                            } as Player,
                            senderId: profileRef.current.id,
                            senderName: profileRef.current.name,
                        }
                        
                        try {
                            connection.send(joinMessage)
                            if (!resolved) {
                                resolved = true
                                console.log("[Peer] Successfully joined room")
                                resolve(true)
                            }
                        } catch (err) {
                            console.error("[Peer] Error sending join message:", err)
                            if (!resolved) {
                                resolved = true
                                resolve(false)
                            }
                        }
                    })

                    connection.on("data", (data) => {
                        try {
                            handleMessageRef.current(data as PeerMessage)
                        } catch (err) {
                            console.error("[Peer] Error handling connection data:", err)
                        }
                    })

                    connection.on("close", () => {
                        clearTimeout(timeout)
                        connectionsRef.current.delete(connection.peer)
                        forceUpdate({})
                        if (!resolved) {
                            resolved = true
                            resolve(false)
                        }
                    })

                    connection.on("error", (err) => {
                        console.error("[Peer] Connection error:", err)
                        clearTimeout(timeout)
                        if (!resolved) {
                            resolved = true
                            resolve(false)
                        }
                    })
                }

                setupJoinConnection(conn)
            } catch (err) {
                console.error("[Peer] Error connecting to host:", err)
                resolve(false)
            }
        })
    }, [])

    // Send message to all peers
    const sendMessage = useCallback(
        (message: PeerMessage) => {
            try {
                broadcast(message)
                // Also handle locally for host
                if (isHost) {
                    handleMessageRef.current(message)
                }
            } catch (err) {
                console.error("[Peer] Error sending message:", err)
            }
        },
        [broadcast, isHost],
    )

    // Set ready status
    const setReady = useCallback(
        (ready: boolean) => {
            const message: PeerMessage = {
                type: "ready",
                payload: { playerId: profileRef.current.id, ready },
                senderId: profileRef.current.id,
                senderName: profileRef.current.name,
            }
            sendMessage(message)

            // Update local state for non-host
            if (!isHost) {
                setRoomState((prev) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        players: prev.players.map((p) => (p.id === profileRef.current.id ? { ...p, isReady: ready } : p)),
                    }
                })
            }
        },
        [sendMessage, isHost],
    )

    // Start game (host only)
    const startGame = useCallback(() => {
        if (!isHost || !roomStateRef.current) return

        try {
            const deck = createDeck()
            const players = roomStateRef.current.players.map((p, i) => {
                const cards = [deck.pop()!, deck.pop()!]
                const score = calculatePoints(cards)
                const handType = getHandType(cards)
                return {
                    ...p,
                    cards,
                    score,
                    handType,
                    isDealer: i === 0,
                }
            })

            const gameState: GameState = {
                phase: "playing",
                players,
                dealerIndex: 0,
                currentBet: 10,
                deck,
                round: 1,
            }

            const newRoomState: RoomState = {
                ...roomStateRef.current,
                players,
                gameState,
            }

            setRoomState(newRoomState)
            roomStateRef.current = newRoomState

            const startMessage: PeerMessage = {
                type: "start",
                payload: newRoomState,
                senderId: profileRef.current.id,
                senderName: profileRef.current.name,
            }
            broadcast(startMessage)
        } catch (err) {
            console.error("[Peer] Error starting game:", err)
        }
    }, [isHost, broadcast])

    // Send chat message
    const sendChat = useCallback(
        (message: string) => {
            try {
                const chatMsg: ChatMessage = {
                    id: `${Date.now()}-${profileRef.current.id}`,
                    playerId: profileRef.current.id,
                    playerName: profileRef.current.name,
                    message,
                    timestamp: Date.now(),
                }

                const peerMessage: PeerMessage = {
                    type: "chat",
                    payload: chatMsg,
                    senderId: profileRef.current.id,
                    senderName: profileRef.current.name,
                }

                sendMessage(peerMessage)

                // Add to local state
                setRoomState((prev) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        messages: [...prev.messages, chatMsg],
                    }
                })
            } catch (err) {
                console.error("[Peer] Error sending chat:", err)
            }
        },
        [sendMessage],
    )

    // Draw card
    const drawCard = useCallback(() => {
        console.log("[Peer] Draw card")
    }, [])

    // Stand (not draw)
    const stand = useCallback(() => {
        console.log("[Peer] Stand")
    }, [])

    // Leave room
    const leaveRoom = useCallback(() => {
        console.log("[Peer] Leaving room...")
        
        try {
            // Send leave message if we're connected
            if (peerRef.current && peerRef.current.open) {
                const message: PeerMessage = {
                    type: "leave",
                    payload: profileRef.current.id,
                    senderId: profileRef.current.id,
                    senderName: profileRef.current.name,
                }
                broadcast(message)
            }

            // Close all connections
            connectionsRef.current.forEach((conn) => {
                try {
                    conn.close()
                } catch (err) {
                    console.error("[Peer] Error closing connection:", err)
                }
            })
            connectionsRef.current.clear()

            // Destroy peer
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.destroy()
                peerRef.current = null
            }

            // Reset state
            setPeerId(null)
            setIsConnected(false)
            setRoomState(null)
            roomStateRef.current = null
            
        } catch (err) {
            console.error("[Peer] Error leaving room:", err)
        }
    }, [broadcast])

    const value: PeerContextType = {
        peerId,
        isConnected,
        isHost,
        roomState,
        connections: connectionsRef.current,
        sendMessage,
        joinRoom,
        startGame,
        setReady,
        sendChat,
        drawCard,
        stand,
        leaveRoom,
    }

    return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>
}