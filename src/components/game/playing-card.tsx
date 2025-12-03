"use client"

import { cn } from "@/lib/utils"
import type { Card } from "@/lib/types"
import { getSuitSymbol, isRedSuit } from "@/lib/game-utils"

interface PlayingCardProps {
    card?: Card
    faceDown?: boolean
    size?: "sm" | "md" | "lg"
    className?: string
}

export function PlayingCard({ card, faceDown = false, size = "md", className }: PlayingCardProps) {
    const sizeClasses = {
        sm: "w-10 h-14 text-xs",
        md: "w-14 h-20 text-sm",
        lg: "w-20 h-28 text-lg",
    }

    if (faceDown || !card) {
        return (
            <div
                className={cn(
                    "rounded-lg bg-gradient-to-br from-red-700 to-red-900 border-2 border-red-600 shadow-lg flex items-center justify-center",
                    sizeClasses[size],
                    className,
                )}
            >
                <div className="w-3/4 h-3/4 rounded border border-red-500/50 bg-red-800/50 flex items-center justify-center">
                    <span className="text-red-400/50 font-bold">♦</span>
                </div>
            </div>
        )
    }

    const symbol = getSuitSymbol(card.suit)
    const isRed = isRedSuit(card.suit)

    return (
        <div
            className={cn(
                "rounded-lg bg-white border border-gray-300 shadow-lg flex flex-col p-1",
                sizeClasses[size],
                className,
            )}
        >
            <div className={cn("text-left font-bold leading-none", isRed ? "text-red-600" : "text-gray-900")}>
                {card.rank}
                <br />
                <span className="text-xs">{symbol}</span>
            </div>
            <div className={cn("flex-1 flex items-center justify-center text-2xl", isRed ? "text-red-600" : "text-gray-900")}>
                {symbol}
            </div>
            <div className={cn("text-right font-bold leading-none rotate-180", isRed ? "text-red-600" : "text-gray-900")}>
                {card.rank}
                <br />
                <span className="text-xs">{symbol}</span>
            </div>
        </div>
    )
}
