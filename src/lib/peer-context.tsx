"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import Peer, { type DataConnection } from "peerjs"
import type { PeerMessage, Player, RoomState, ChatMessage, GameState, Card as CardType } from "./types"
import { getOrCreateProfile } from "./storage"
import { createDeck, calculatePoints, getHandType, shuffleDeck } from "./game-utils"

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
                    balance: 1000,
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
            console.log("[Peer] Handling message type:", message.type)
            
            setRoomState((prevState) => {
                // สำหรับ sync message
                if (message.type === "sync") {
                    console.log("[Peer] Syncing room state")
                    return message.payload as RoomState
                }

                // สำหรับ start message
                if (message.type === "start") {
                    console.log("[Peer] Game started")
                    return message.payload as RoomState
                }

                // สำหรับ game action messages
                if (message.type === "game_action") {
                    const action = message.payload as {
                        type: "draw" | "stand" | "bet"
                        playerId: string
                        card?: CardType
                        amount?: number
                    }
                    
                    if (!prevState || !prevState.gameState) return prevState
                    
                    const newPlayers = [...prevState.gameState.players]
                    const playerIndex = newPlayers.findIndex(p => p.id === action.playerId)
                    
                    if (playerIndex === -1) return prevState
                    
                    if (action.type === "draw" && action.card) {
                        // จั่วไพ่
                        newPlayers[playerIndex].cards.push(action.card)
                        const nextPlayerIndex = (prevState.gameState.currentPlayerIndex + 1) % newPlayers.length
                        
                        const newGameState: GameState = {
                            ...prevState.gameState,
                            players: newPlayers,
                            currentPlayerIndex: nextPlayerIndex,
                            deck: prevState.gameState.deck.filter(c => 
                                !(c.rank === action.card?.rank && c.suit === action.card?.suit)
                            )
                        }
                        
                        return {
                            ...prevState,
                            gameState: newGameState
                        }
                    }
                    
                    if (action.type === "stand") {
                        // ไม่จั่ว
                        const nextPlayerIndex = (prevState.gameState.currentPlayerIndex + 1) % newPlayers.length
                        const newGameState: GameState = {
                            ...prevState.gameState,
                            currentPlayerIndex: nextPlayerIndex
                        }
                        
                        return {
                            ...prevState,
                            gameState: newGameState
                        }
                    }
                }

                // สำหรับ round end
                if (message.type === "round_end") {
                    if (!prevState || !prevState.gameState) return prevState
                    
                    const results = message.payload as {
                        winnerId: string
                        amount: number
                    }[]
                    
                    // อัพเดตเงินผู้เล่น
                    const newPlayers = prevState.gameState.players.map(player => {
                        const result = results.find(r => r.winnerId === player.id)
                        if (result) {
                            return {
                                ...player,
                                balance: (player.balance || 1000) + result.amount,
                                cards: []
                            }
                        }
                        return {
                            ...player,
                            balance: (player.balance || 1000) - prevState.gameState!.currentBet,
                            cards: []
                        }
                    })
                    
                    const newGameState: GameState = {
                        ...prevState.gameState,
                        players: newPlayers,
                        phase: "waiting",
                        currentPlayerIndex: 0
                    }
                    
                    return {
                        ...prevState,
                        gameState: newGameState
                    }
                }

                // สำหรับ new round
                if (message.type === "new_round") {
                    if (!prevState || !prevState.gameState) return prevState
                    
                    const newDeck = createDeck()
                    const shuffledDeck = shuffleDeck(newDeck)
                    
                    const newPlayers = prevState.gameState.players.map((player, index) => {
                        const cards = [shuffledDeck.pop()!, shuffledDeck.pop()!]
                        const score = calculatePoints(cards)
                        const handType = getHandType(cards)
                        return {
                            ...player,
                            cards,
                            score,
                            handType,
                            isDealer: index === 0
                        }
                    })
                    
                    const newGameState: GameState = {
                        phase: "playing",
                        players: newPlayers,
                        dealerIndex: 0,
                        currentBet: prevState.gameState.currentBet,
                        deck: shuffledDeck,
                        round: prevState.gameState.round + 1,
                        currentPlayerIndex: 1 // เริ่มจากผู้เล่นคนที่ 2 (คนที่ 1 เป็นเจ้ามือ)
                    }
                    
                    return {
                        ...prevState,
                        gameState: newGameState
                    }
                }

                if (!prevState) return prevState

                switch (message.type) {
                    case "join": {
                        const newPlayer = message.payload as Player
                        if (prevState.players.some((p) => p.id === newPlayer.id)) {
                            return prevState
                        }
                        const newState = {
                            ...prevState,
                            players: [...prevState.players, { ...newPlayer, isOnline: true, balance: 1000 }],
                        }
                        if (isHost) {
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
                            players: prevState.players.map((p) => 
                                p.id === playerId ? { ...p, isReady: ready } : p
                            ),
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

    // Initialize Peer
    useEffect(() => {
        const currentProfile = profileRef.current
        const peerIdStr = isHost 
            ? `pokdeng-${roomCode}`
            : `pokdeng-${roomCode}-${currentProfile.id}`

        console.log(`[Peer] Creating Peer with ID: ${peerIdStr}`)

        let peer: Peer
        
        try {
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
            peer = new Peer(peerIdStr, { debug: 0 })
        }

        const setupConnectionInternal = (conn: DataConnection) => {
            conn.on("open", () => {
                connectionsRef.current.set(conn.peer, conn)
                forceUpdate({})

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
                    console.error("[Peer] Error handling message:", err)
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
                setIsConnected(false)
            }
        })

        peer.on("disconnected", () => {
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
            connectionsRef.current.forEach((conn) => {
                try {
                    conn.close()
                } catch (err) {}
            })
            connectionsRef.current.clear()
            
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

                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true
                        conn.close()
                        resolve(false)
                    }
                }, 15000)

                conn.on("open", () => {
                    clearTimeout(timeout)
                    connectionsRef.current.set(conn.peer, conn)
                    forceUpdate({})

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
                            balance: 1000,
                        } as Player,
                        senderId: profileRef.current.id,
                        senderName: profileRef.current.name,
                    }
                    
                    try {
                        conn.send(joinMessage)
                        if (!resolved) {
                            resolved = true
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

                conn.on("data", (data) => {
                    try {
                        handleMessageRef.current(data as PeerMessage)
                    } catch (err) {
                        console.error("[Peer] Error handling connection data:", err)
                    }
                })

                conn.on("close", () => {
                    clearTimeout(timeout)
                    connectionsRef.current.delete(conn.peer)
                    forceUpdate({})
                    if (!resolved) {
                        resolved = true
                        resolve(false)
                    }
                })

                conn.on("error", (err) => {
                    console.error("[Peer] Connection error:", err)
                    clearTimeout(timeout)
                    if (!resolved) {
                        resolved = true
                        resolve(false)
                    }
                })
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
        },
        [sendMessage],
    )

    // Start game (host only)
    const startGame = useCallback(() => {
        if (!isHost || !roomStateRef.current) return

        console.log("[Peer] Starting game...")
        
        try {
            const deck = createDeck()
            const shuffledDeck = shuffleDeck(deck)
            
            const players = roomStateRef.current.players.map((p, i) => {
                const cards = [shuffledDeck.pop()!, shuffledDeck.pop()!]
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
                deck: shuffledDeck,
                round: 1,
                currentPlayerIndex: 1 // เริ่มจากผู้เล่นคนที่ 2
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
            console.log("[Peer] Game started successfully")
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
            } catch (err) {
                console.error("[Peer] Error sending chat:", err)
            }
        },
        [sendMessage],
    )

    // Draw card
    const drawCard = useCallback(() => {
        if (!roomStateRef.current?.gameState) return

        console.log("[Peer] Drawing card...")
        
        const gameState = roomStateRef.current.gameState
        const playerIndex = gameState.players.findIndex(p => p.id === profileRef.current.id)
        
        if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) {
            console.log("[Peer] Not your turn")
            return
        }

        if (gameState.deck.length === 0) {
            console.log("[Peer] No more cards in deck")
            return
        }

        const card = gameState.deck.pop()!
        
        const actionMessage: PeerMessage = {
            type: "game_action",
            payload: {
                type: "draw",
                playerId: profileRef.current.id,
                card
            },
            senderId: profileRef.current.id,
            senderName: profileRef.current.name,
        }

        sendMessage(actionMessage)
    }, [sendMessage])

    // Stand (not draw)
    const stand = useCallback(() => {
        if (!roomStateRef.current?.gameState) return

        console.log("[Peer] Standing...")
        
        const gameState = roomStateRef.current.gameState
        const playerIndex = gameState.players.findIndex(p => p.id === profileRef.current.id)
        
        if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) {
            console.log("[Peer] Not your turn")
            return
        }

        const actionMessage: PeerMessage = {
            type: "game_action",
            payload: {
                type: "stand",
                playerId: profileRef.current.id
            },
            senderId: profileRef.current.id,
            senderName: profileRef.current.name,
        }

        sendMessage(actionMessage)
    }, [sendMessage])

    // Leave room
    const leaveRoom = useCallback(() => {
        console.log("[Peer] Leaving room...")
        
        try {
            if (peerRef.current && peerRef.current.open) {
                const message: PeerMessage = {
                    type: "leave",
                    payload: profileRef.current.id,
                    senderId: profileRef.current.id,
                    senderName: profileRef.current.name,
                }
                broadcast(message)
            }

            connectionsRef.current.forEach((conn) => {
                try {
                    conn.close()
                } catch (err) {
                    console.error("[Peer] Error closing connection:", err)
                }
            })
            connectionsRef.current.clear()

            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.destroy()
                peerRef.current = null
            }

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