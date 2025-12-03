import type { Card, Suit, Rank, HandType, Player } from "./types"

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

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

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

// แก้ไขค่าของไพ่ (J, Q, K ในการบวกแต้มป๊อกเด้งมีค่าเป็น 10 หรือ 0)
export function getCardValue(rank: Rank): number {
    if (rank === "A") return 1
    if (["10", "J", "Q", "K"].includes(rank)) return 10
    return Number.parseInt(rank)
}

// คำนวณแต้ม (เอาแค่หลักหน่วย)
export function calculatePoints(cards: Card[]): number {
    const total = cards.reduce((sum, card) => sum + card.value, 0)
    return total % 10
}

export function getHandType(cards: Card[]): HandType {
    const points = calculatePoints(cards)

    // ป๊อก 8, 9 ต้องมี 2 ใบ
    if (cards.length === 2) {
        if (points === 9) return "pok9"
        if (points === 8) return "pok8"
        
        // ตอง (ในป๊อกเด้งบางที่เล่นตอง แต่ปกติตอง 3 ใบ)
        if (cards[0].rank === cards[1].rank) return "triple" // คู่ (บางกติกา)
    }

    if (cards.length === 3) {
        // ตอง
        if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
            return "triple"
        }

        // เรียง & สามสี (ข้ามไปก่อนเพื่อความง่ายของ logic หลัก)
    }

    return "normal"
}

export function getHandTypeName(handType: HandType): string {
    switch (handType) {
        case "pok9": return "ป็อก 9"
        case "pok8": return "ป็อก 8"
        case "triple": return "ตอง"
        default: return "ธรรมดา"
    }
}

// Logic การชนะ: ป๊อก 9 > ป๊อก 8 > ตอง > แต้มปกติ
// return > 0 ถ้า p1 ชนะ, < 0 ถ้า p2 ชนะ, 0 ถ้าเสมอ
export function compareHands(p1: Player, p2: Player): number {
    const typeRank = { "pok9": 4, "pok8": 3, "triple": 2, "straight": 1, "samColor": 1, "normal": 0 }
    
    const t1 = typeRank[p1.handType || "normal"] || 0
    const t2 = typeRank[p2.handType || "normal"] || 0

    if (t1 !== t2) return t1 - t2
    
    // ถ้าประเภทเดียวกัน วัดที่แต้ม
    return (p1.score || 0) - (p2.score || 0)
}

export function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
}

export function generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const AVATARS = ["😀", "😎", "🤠", "🥳", "😺", "🐶", "🐱", "🐼", "🐨", "🦊", "🦁", "🐯", "🐻", "🐸", "🐵", "🦄"]

export function getRandomAvatar(): string {
    return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

export function getSuitSymbol(suit: Suit): string {
    switch (suit) {
        case "hearts": return "♥"
        case "diamonds": return "♦"
        case "clubs": return "♣"
        case "spades": return "♠"
    }
}

export function isRedSuit(suit: Suit): boolean {
    return suit === "hearts" || suit === "diamonds"
}