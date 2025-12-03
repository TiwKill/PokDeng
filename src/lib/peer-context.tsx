"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import Peer, { type DataConnection } from "peerjs"
import type { PeerMessage, Player, RoomState, ChatMessage, GameState, Card as CardType } from "./types"
import { getOrCreateProfile } from "./storage"
import { createDeck, calculatePoints, getHandType, shuffleDeck, compareHands } from "./game-utils"

interface PeerContextType {
    peerId: string | null
    isConnected: boolean
    isHost: boolean
    roomState: RoomState | null
    sendMessage: (message: PeerMessage) => void
    joinRoom: (hostPeerId: string) => Promise<boolean>
    startGame: () => void
    setReady: (ready: boolean) => void
    sendChat: (message: string) => void
    drawCard: () => void
    stand: () => void
    leaveRoom: () => void
    connections: Map<string, DataConnection>
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

export function PeerProvider({ children, roomCode, isHost }: { children: ReactNode, roomCode: string, isHost: boolean }) {
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

    // Helper: Broadcast logic
    const broadcast = useCallback((message: PeerMessage) => {
        connectionsRef.current.forEach((conn) => {
            if (conn.open) conn.send(message)
        })
    }, [])

    const syncRoomState = useCallback((state: RoomState) => {
        setRoomState(state)
        roomStateRef.current = state

        if (isHost) {
            broadcast({
                type: "sync",
                payload: state,
                senderId: profileRef.current.id,
                senderName: profileRef.current.name,
            })
        }
    }, [broadcast, isHost])

    // --- HOST LOGIC: Process Game Actions ---
    const processGameAction = useCallback((action: any) => {
        if (!isHost || !roomStateRef.current?.gameState) return

        const currentState = roomStateRef.current
        const gameState = currentState.gameState!
        let newPlayers = [...gameState.players]
        let newDeck = [...gameState.deck]
        let nextPlayerIndex = gameState.currentPlayerIndex
        let nextPhase = gameState.phase

        const currentPlayer = newPlayers[gameState.currentPlayerIndex]

        // ตรวจสอบว่าเป็นตาของผู้เล่นคนนั้นจริงๆ หรือไม่
        if (action.playerId !== currentPlayer.id) {
            console.warn("Not this player's turn")
            return
        }

        if (action.type === "draw") {
            if (newDeck.length > 0) {
                const card = newDeck.pop()!
                currentPlayer.cards.push(card)
                currentPlayer.score = calculatePoints(currentPlayer.cards)
                currentPlayer.handType = getHandType(currentPlayer.cards)
            }
        }

        // Move to next player
        nextPlayerIndex++

        // Check if round should end (Dealer just played) or move to dealer
        if (gameState.currentPlayerIndex === 0) {
            // Dealer just played. End of round.
            nextPhase = "showdown"
            nextPlayerIndex = -1 // No current player

            // Calculate Results (Everyone vs Dealer)
            const dealer = newPlayers[0] // Assuming index 0 is dealer

            // Update balances based on comparison with Dealer
            newPlayers = newPlayers.map((p, idx) => {
                if (idx === 0) return p // Skip dealer for now

                const result = compareHands(p, dealer)
                const bet = p.bet || gameState.currentBet // Use default bet if not set

                if (result > 0) {
                    // Player Wins
                    p.balance = (p.balance || 0) + bet
                    dealer.balance = (dealer.balance || 0) - bet
                } else if (result < 0) {
                    // Player Loses
                    p.balance = (p.balance || 0) - bet
                    dealer.balance = (dealer.balance || 0) + bet
                }
                // Draw = no change
                return p
            })
        } else if (nextPlayerIndex >= newPlayers.length) {
            // All players played, now Dealer's turn
            nextPlayerIndex = 0
        }

        const newState: RoomState = {
            ...currentState,
            gameState: {
                ...gameState,
                players: newPlayers,
                deck: newDeck,
                currentPlayerIndex: nextPlayerIndex,
                phase: nextPhase
            }
        }

        syncRoomState(newState)

        // If showdown, wait a bit then reset or allow new round
        if (nextPhase === "showdown") {
            // Optional: Auto reset after 5-10 seconds?
        }

    }, [isHost, syncRoomState])

    // --- Message Handler ---
    const handleMessage = useCallback((message: PeerMessage) => {
        // 1. Sync Logic (Client receives state)
        if (message.type === "sync") {
            setRoomState(message.payload as RoomState)
            roomStateRef.current = message.payload as RoomState
            return
        }

        // 2. Client Action -> Send to Host
        // ถ้าเราเป็น Host เราประมวลผลเลย
        if (isHost) {
            switch (message.type) {
                case "join":
                    const newPlayer = message.payload as Player
                    if (!roomStateRef.current?.players.some(p => p.id === newPlayer.id)) {
                        const newState = {
                            ...roomStateRef.current!,
                            players: [...roomStateRef.current!.players, { ...newPlayer, isReady: false }]
                        }
                        syncRoomState(newState)
                    }
                    break
                case "leave":
                    const leftPlayerId = message.payload as string
                    syncRoomState({
                        ...roomStateRef.current!,
                        players: roomStateRef.current!.players.filter(p => p.id !== leftPlayerId)
                    })
                    break
                case "ready":
                    const { playerId, ready } = message.payload as any
                    syncRoomState({
                        ...roomStateRef.current!,
                        players: roomStateRef.current!.players.map(p =>
                            p.id === playerId ? { ...p, isReady: ready } : p
                        )
                    })
                    break
                case "game_action":
                    processGameAction(message.payload)
                    break
                case "chat":
                    syncRoomState({
                        ...roomStateRef.current!,
                        messages: [...roomStateRef.current!.messages, message.payload as ChatMessage]
                    })
                    break
            }
        }
    }, [isHost, syncRoomState, processGameAction])

    // Send logic: If Host, process locally. If Client, send to Host.
    const sendToHost = useCallback((msg: PeerMessage) => {
        if (isHost) {
            handleMessage(msg)
        } else {
            // Find host connection
            // Note: In this simple implementation, we broadcast actions 
            // but ideally we should send only to host. 
            // Current setup: Peer connects to Host. So sending on connection works.
            if (connectionsRef.current.size > 0) {
                // Send to the first connection (which is Host for clients)
                const hostConn = connectionsRef.current.values().next().value
                if (hostConn) hostConn.send(msg)
            }
        }
    }, [isHost, handleMessage])

    const handleMessageRef = useRef(handleMessage)
    useEffect(() => {
        handleMessageRef.current = handleMessage
    }, [handleMessage])

    // Initialize Peer
    useEffect(() => {
        const currentProfile = profileRef.current
        const peerIdStr = isHost ? `pokdeng-${roomCode}` : `pokdeng-${roomCode}-${currentProfile.id}`

        const peer = new Peer(peerIdStr) // Simplified config for demo

        peer.on("open", (id) => {
            setPeerId(id)
            setIsConnected(true)
            if (isHost) {
                setRoomState({
                    roomCode,
                    hostId: currentProfile.id,
                    players: [{ ...currentProfile, isDealer: true, cards: [], isReady: true, isOnline: true, balance: 1000, bet: 0 }],
                    gameState: null,
                    messages: []
                })
            }
        })

        peer.on("connection", (conn) => {
            conn.on("open", () => {
                connectionsRef.current.set(conn.peer, conn)
                // If Host, send initial state
                if (isHost && roomStateRef.current) {
                    conn.send({ type: "sync", payload: roomStateRef.current })
                }
            })
            conn.on("data", (data) => handleMessage(data as PeerMessage))
            conn.on("close", () => { connectionsRef.current.delete(conn.peer); forceUpdate({}) })
        })

        peerRef.current = peer
        return () => { peer.destroy() }
    }, [roomCode, isHost, handleMessage])

    // Join room (for non-host)
    const joinRoom = async (hostId: string) => {
        if (!peerRef.current) return false
        const conn = peerRef.current.connect(hostId)

        return new Promise<boolean>((resolve) => {
            conn.on("open", () => {
                connectionsRef.current.set(conn.peer, conn)
                conn.send({
                    type: "join",
                    payload: profileRef.current,
                    senderId: profileRef.current.id,
                    senderName: profileRef.current.name
                })
                conn.on("data", (data) => handleMessage(data as PeerMessage))
                resolve(true)
            })
            setTimeout(() => resolve(false), 5000)
        })
    }

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
    const setReady = useCallback((ready: boolean) => {
        sendToHost({
            type: "ready",
            payload: { playerId: profileRef.current.id, ready },
            senderId: profileRef.current.id,
            senderName: profileRef.current.name
        })
    }, [sendToHost])

    const startGame = useCallback(() => {
        if (!isHost || !roomStateRef.current) return

        const deck = createDeck()
        // Deal 2 cards to everyone
        const players = roomStateRef.current.players.map((p, i) => {
            const cards = [deck.pop()!, deck.pop()!]
            return {
                ...p,
                cards,
                score: calculatePoints(cards),
                handType: getHandType(cards),
                isDealer: i === 0, // First player is dealer
                bet: 100 // Default bet
            }
        })

        const gameState: GameState = {
            phase: "playing",
            players,
            dealerIndex: 0,
            currentBet: 100,
            deck,
            round: (roomStateRef.current.gameState?.round || 0) + 1,
            currentPlayerIndex: 1 // Start with player after dealer
        }

        syncRoomState({ ...roomStateRef.current, gameState })

    }, [isHost, syncRoomState])

    // Send chat message
    const sendChat = useCallback((text: string) => {
        const msg: ChatMessage = {
            id: Date.now().toString(),
            playerId: profileRef.current.id,
            playerName: profileRef.current.name,
            message: text,
            timestamp: Date.now()
        }
        sendToHost({
            type: "chat",
            payload: msg,
            senderId: profileRef.current.id,
            senderName: profileRef.current.name
        })
    }, [sendToHost])

    // Draw card
    const drawCard = useCallback(() => {
        sendToHost({
            type: "game_action",
            payload: { type: "draw", playerId: profileRef.current.id },
            senderId: profileRef.current.id,
            senderName: profileRef.current.name
        })
    }, [sendToHost])

    // Stand (not draw)
    const stand = useCallback(() => {
        sendToHost({
            type: "game_action",
            payload: { type: "stand", playerId: profileRef.current.id },
            senderId: profileRef.current.id,
            senderName: profileRef.current.name
        })
    }, [sendToHost])

    // Leave room
    const leaveRoom = () => { window.location.href = '/' }

    return (
        <PeerContext.Provider value={{
            peerId, isConnected, isHost, roomState, connections: connectionsRef.current,
            sendMessage: sendToHost, joinRoom, startGame, setReady, sendChat, drawCard, stand, leaveRoom
        }}>
            {children}
        </PeerContext.Provider>
    )
}