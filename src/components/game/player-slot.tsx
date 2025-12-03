"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { PlayingCard } from "./playing-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Wifi, Clock, DollarSign, Crown } from "lucide-react"

interface PlayerSlotProps {
    player?: Player
    isCurrentUser?: boolean
    isHost?: boolean
    showCards?: boolean
    position: "top" | "left" | "right" | "bottom"
    isTurn?: boolean
    bet?: number
}

export function PlayerSlot({ 
    player, 
    isCurrentUser, 
    isHost, 
    showCards, 
    position,
    isTurn = false,
    bet = 0
}: PlayerSlotProps) {
    const positionClasses = {
        top: "flex-col",
        bottom: "flex-col-reverse",
        left: "flex-row",
        right: "flex-row-reverse",
    }

    if (!player) {
        return (
            <Card className="border-dashed border-2 border-white/20 bg-white/5 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center gap-3 p-4">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-white/10">
                            <User className="w-5 h-5 text-white/40" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/60">ว่าง</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn(
            "relative overflow-hidden border-2 transition-all duration-300",
            isCurrentUser ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-amber-500/10" :
            isTurn ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 shadow-lg shadow-emerald-500/20" :
            "border-white/10 bg-gradient-to-br from-white/5 to-white/10",
            player.isReady && !isCurrentUser && "border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
        )}>
            {isTurn && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse" />
            )}
            
            <CardContent className={cn("relative p-3 sm:p-4", positionClasses[position])}>
                <div className="flex items-center gap-3">
                    {/* Avatar Section */}
                    <div className="relative">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarFallback className={cn(
                                "text-lg font-bold",
                                isHost ? "bg-gradient-to-br from-yellow-500 to-amber-500" :
                                "bg-gradient-to-br from-emerald-500 to-teal-500"
                            )}>
                                {player.avatar}
                            </AvatarFallback>
                        </Avatar>
                        
                        {/* Status Indicators */}
                        <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                            {isHost && (
                                <div className="bg-yellow-500 rounded-full p-0.5">
                                    <Crown className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-950" />
                                </div>
                            )}
                            <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm sm:text-base truncate">
                                {player.name}
                                {isCurrentUser && <span className="text-white/60 ml-1">(คุณ)</span>}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "flex items-center gap-1 text-xs",
                                player.isOnline ? "text-emerald-400" : "text-white/60"
                            )}>
                                <Wifi className="w-3 h-3" />
                                {player.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                            </span>
                            
                            {bet > 0 && (
                                <>
                                    <span className="text-white/40">•</span>
                                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                                        <DollarSign className="w-3 h-3" />
                                        {bet}
                                    </span>
                                </>
                            )}
                            
                            {player.isReady && !isCurrentUser && (
                                <>
                                    <span className="text-white/40">•</span>
                                    <span className="text-xs text-green-400">พร้อม</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cards Section */}
                {player.cards && player.cards.length > 0 && (
                    <div className="mt-3">
                        <div className="flex gap-1 justify-center">
                            {player.cards.map((card, i) => (
                                <PlayingCard
                                    key={i}
                                    card={showCards || isCurrentUser ? card : undefined}
                                    faceDown={!showCards && !isCurrentUser}
                                    size="sm"
                                    className={cn(
                                        "transition-transform duration-300",
                                        i === 0 && "-rotate-3",
                                        i === 1 && "rotate-3",
                                        i === 2 && "-rotate-6"
                                    )}
                                />
                            ))}
                        </div>
                        
                        {!showCards && !isCurrentUser && player.cards.length > 0 && (
                            <div className="text-center mt-2">
                                <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                                    {player.cards.length} ใบ
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                {/* Turn Indicator */}
                {isTurn && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <div className="animate-bounce bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>ตาคุณ!</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}