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
    }

    if (cards.length === 3) {
        // ตอง
        if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
            return "triple"
        }

        // เรียง
        if (checkStraight(cards)) {
            return "straight"
        }

        // สามสี
        if (checkSamColor(cards)) {
            return "samColor"
        }
    }

    return "normal"
}

export function getHandTypeName(handType: HandType): string {
    switch (handType) {
        case "pok9": return "ป็อก 9"
        case "pok8": return "ป็อก 8"
        case "triple": return "ตอง"
        case "straight": return "เรียง"
        case "samColor": return "สามสี"
        default: return "ธรรมดา"
    }
}

// Logic การชนะ: ป๊อก 9 > ป๊อก 8 > ตอง > แต้มปกติ
// return > 0 ถ้า p1 ชนะ, < 0 ถ้า p2 ชนะ, 0 ถ้าเสมอ
export function compareHands(p1: Player, p2: Player): number {
    const typeRank = {
        "pok9": 4,
        "pok8": 3,
        "triple": 2,
        "straight": 1,
        "samColor": 1,
        "normal": 0
    }

    const t1 = typeRank[p1.handType || "normal"] || 0
    const t2 = typeRank[p2.handType || "normal"] || 0

    if (t1 > t2) return 1
    if (t1 < t2) return -1

    // ถ้าประเภทเดียวกัน วัดที่แต้ม (สูงกว่า ชนะ)
    const score1 = p1.score || 0
    const score2 = p2.score || 0

    if (score1 > score2) return 1
    if (score1 < score2) return -1

    // ถ้าแต้มเท่ากัน
    return 0
}

export function checkStraight(cards: Card[]): boolean {
    if (cards.length !== 3) return false

    // Map ranks to their sequential values for straight checking
    const getRankValue = (rank: Rank): number => {
        if (rank === "A") return 1
        if (rank === "J") return 11
        if (rank === "Q") return 12
        if (rank === "K") return 13
        return Number.parseInt(rank)
    }

    const values = cards.map(c => getRankValue(c.rank)).sort((a, b) => a - b)

    // Check for normal straights (e.g., 2-3-4, 9-10-J)
    if (values[0] + 1 === values[1] && values[1] + 1 === values[2]) return true

    // Check for Q-K-A (12-13-1 when sorted becomes 1-12-13)
    if (values[0] === 1 && values[1] === 12 && values[2] === 13) return true

    return false
}

export function checkSamColor(cards: Card[]): boolean {
    if (cards.length !== 3) return false
    return cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit
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