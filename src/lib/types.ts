// Types for Pok Deng game

export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

export interface Card {
    suit: Suit
    rank: Rank
    value: number
}

export interface Player {
    id: string
    name: string
    avatar: string
    cards: Card[]
    bet: number
    isDealer: boolean
    isReady: boolean
    isOnline: boolean
    score?: number
    handType?: HandType
    balance?: number
}

export interface PlayerProfile {
    id: string
    name: string
    avatar: string
    gamesPlayed: number
    wins: number
    createdAt: string
}

export type HandType =
    | "pok9" // ป็อก 9
    | "pok8" // ป็อก 8
    | "triple" // ตอง
    | "straight" // เรียง
    | "samColor" // สามสี
    | "normal" // ธรรมดา

export type GamePhase =
    | "waiting" // รอผู้เล่น
    | "betting" // เดิมพัน
    | "dealing" // แจกไพ่
    | "playing" // เล่น
    | "showdown" // เปิดไพ่
    | "result" // ผลลัพธ์

export interface GameState {
    currentPlayerIndex: number
    phase: GamePhase
    players: Player[]
    dealerIndex: number
    currentBet: number
    deck: Card[]
    round: number
}

export interface RoomState {
    roomCode: string
    hostId: string
    players: Player[]
    gameState: GameState | null
    messages: ChatMessage[]
}

export interface ChatMessage {
    id: string
    playerId: string
    playerName: string
    message: string
    timestamp: number
}

export interface PeerMessage {
    type:
    | "join"
    | "leave"
    | "ready"
    | "start"
    | "bet"
    | "draw"
    | "stand"
    | "chat"
    | "sync"
    | "kick"
    | "game_action"
    | "round_end"
    | "new_round"
    payload: unknown
    senderId: string
    senderName: string
}
