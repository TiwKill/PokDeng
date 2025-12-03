import type { PlayerProfile } from "./types"
import { generatePlayerId, getRandomAvatar } from "./game-utils"

const PROFILE_KEY = "pokdeng_profile"

export const AVATARS = ["😀", "😎", "🤠", "🥳", "😺", "🐶", "🐱", "🐼", "🐨", "🦊", "🦁", "🐯", "🐻", "🐸", "🐵", "🦄"]

export function getProfile(): PlayerProfile | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem(PROFILE_KEY)
    if (!stored) return null
    try {
        return JSON.parse(stored)
    } catch {
        return null
    }
}

export function saveProfile(profile: PlayerProfile): void {
    if (typeof window === "undefined") return
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function createDefaultProfile(): PlayerProfile {
    return {
        id: generatePlayerId(),
        name: `ผู้เล่น${Math.floor(Math.random() * 1000)}`,
        avatar: getRandomAvatar(),
        gamesPlayed: 0,
        wins: 0,
        createdAt: new Date().toISOString(),
    }
}

export function getOrCreateProfile(): PlayerProfile {
    let profile = getProfile()
    if (!profile) {
        profile = createDefaultProfile()
        saveProfile(profile)
    }
    return profile
}

export function updateProfile(updates: Partial<PlayerProfile>): PlayerProfile {
    const profile = getOrCreateProfile()
    const updated = { ...profile, ...updates }
    saveProfile(updated)
    return updated
}

export function resetStats(): PlayerProfile {
    const profile = getOrCreateProfile()
    const updated = { ...profile, gamesPlayed: 0, wins: 0 }
    saveProfile(updated)
    return updated
}
