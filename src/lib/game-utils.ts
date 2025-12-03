import type { Card, Suit, Rank, HandType, Player } from "./types"

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

// สร้างสำรับไพ่ 52 ใบ
export function createDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                value: getCardValue(rank),
            })
        }
    }
    return shuffleDeck(deck)
}

// สับไพ่
export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

// ค่าของไพ่แต่ละใบ
export function getCardValue(rank: Rank): number {
    if (rank === "A") return 1
    if (["J", "Q", "K"].includes(rank)) return 10
    return Number.parseInt(rank)
}

// คำนวณแต้มป็อกเด้ง (หลักหน่วย)
export function calculatePoints(cards: Card[]): number {
    const total = cards.reduce((sum, card) => sum + card.value, 0)
    return total % 10
}

// ตรวจสอบประเภทมือ
export function getHandType(cards: Card[]): HandType {
    if (cards.length === 2) {
        const points = calculatePoints(cards)
        if (points === 9) return "pok9"
        if (points === 8) return "pok8"
    }

    if (cards.length === 3) {
        // ตอง (3 ใบเหมือนกัน)
        if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
            return "triple"
        }

        // เรียง (3 ใบติดกัน)
        const values = cards
            .map((c) => {
                if (c.rank === "A") return 1
                if (c.rank === "J") return 11
                if (c.rank === "Q") return 12
                if (c.rank === "K") return 13
                return Number.parseInt(c.rank)
            })
            .sort((a, b) => a - b)

        if (values[2] - values[1] === 1 && values[1] - values[0] === 1) {
            return "straight"
        }

        // สามสี (3 ใบสีเดียวกัน)
        if (cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit) {
            return "samColor"
        }
    }

    return "normal"
}

// คำนวณตัวคูณจากประเภทมือ
export function getMultiplier(handType: HandType): number {
    switch (handType) {
        case "pok9":
            return 2
        case "pok8":
            return 2
        case "triple":
            return 5
        case "straight":
            return 3
        case "samColor":
            return 3
        default:
            return 1
    }
}

// ชื่อประเภทมือเป็นภาษาไทย
export function getHandTypeName(handType: HandType): string {
    switch (handType) {
        case "pok9":
            return "ป็อก 9"
        case "pok8":
            return "ป็อก 8"
        case "triple":
            return "ตอง"
        case "straight":
            return "เรียง"
        case "samColor":
            return "สามสี"
        default:
            return "ธรรมดา"
    }
}

// เปรียบเทียบมือ (return > 0 ถ้า player1 ชนะ, < 0 ถ้า player2 ชนะ, 0 ถ้าเสมอ)
export function compareHands(player1: Player, player2: Player): number {
    const type1 = player1.handType || "normal"
    const type2 = player2.handType || "normal"
    const score1 = player1.score || 0
    const score2 = player2.score || 0

    const typeOrder: HandType[] = ["pok9", "pok8", "triple", "straight", "samColor", "normal"]
    const typeRank1 = typeOrder.indexOf(type1)
    const typeRank2 = typeOrder.indexOf(type2)

    // เปรียบเทียบประเภทมือก่อน
    if (typeRank1 !== typeRank2) {
        return typeRank2 - typeRank1
    }

    // ถ้าประเภทเท่ากัน เปรียบเทียบแต้ม
    return score1 - score2
}

// สร้างรหัสห้อง 6 ตัวอักษร
export function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// สร้าง ID ผู้เล่น
export function generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// อวาตาร์เริ่มต้น
export const AVATARS = ["😀", "😎", "🤠", "🥳", "😺", "🐶", "🐱", "🐼", "🐨", "🦊", "🦁", "🐯", "🐻", "🐸", "🐵", "🦄"]

export function getRandomAvatar(): string {
    return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

// แปลง suit เป็น symbol
export function getSuitSymbol(suit: Suit): string {
    switch (suit) {
        case "hearts":
            return "♥"
        case "diamonds":
            return "♦"
        case "clubs":
            return "♣"
        case "spades":
            return "♠"
    }
}

// เช็คสีของ suit
export function isRedSuit(suit: Suit): boolean {
    return suit === "hearts" || suit === "diamonds"
}
