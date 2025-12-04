"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { PlayingCard } from "./playing-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, WifiOff, Clock, DollarSign, Crown, CheckCircle2 } from "lucide-react"

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

    // ถ้าไม่มีผู้เล่น (Empty Slot)
    if (!player) {
        return (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-white/10 bg-black/20 backdrop-blur-sm h-full w-full transition-all hover:bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <User className="w-6 h-6 text-white/20" />
                </div>
                <span className="text-xs font-medium text-white/40">ว่าง</span>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative group transition-all duration-500",
            isTurn ? "scale-105 z-20" : "z-10"
        )}>
            {/* Turn Indicator Glow Effect */}
            {isTurn && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-2xl blur opacity-75 animate-pulse" />
            )}

            <Card className={cn(
                "relative overflow-visible border-0 backdrop-blur-md shadow-xl transition-all duration-300",
                // Background Styling
                isCurrentUser
                    ? "bg-slate-900/80 ring-1 ring-yellow-500/50"
                    : "bg-black/60 ring-1 ring-white/10",
                isTurn && "bg-slate-800/90"
            )}>

                {/* Status Badge (Ready / Turn) - Floating Top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex gap-2 w-full justify-center">
                    {isTurn && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 border-0 shadow-lg text-black font-bold animate-bounce">
                            <Clock className="w-3 h-3 mr-1" /> ตาคุณ!
                        </Badge>
                    )}
                    {player.isReady && !isTurn && !isCurrentUser && (
                        <Badge className="bg-emerald-500/90 hover:bg-emerald-600 border-0 text-white shadow-lg">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> พร้อม
                        </Badge>
                    )}
                </div>

                <CardContent className="p-3">
                    <div className="flex flex-col gap-3">

                        {/* Top Section: Avatar & Info */}
                        <div className="flex items-center gap-3">
                            {/* Avatar Wrapper */}
                            <div className="relative">
                                <Avatar className={cn(
                                    "h-12 w-12 border-2 shadow-lg",
                                    isHost ? "border-yellow-400" : "border-white/20",
                                    isTurn && "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                )}>
                                    <AvatarFallback className={cn(
                                        "text-lg font-bold text-white",
                                        "bg-gradient-to-br from-slate-700 to-slate-900"
                                    )}>
                                        {player.avatar}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Host Crown */}
                                {isHost && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-950 rounded-full p-0.5 shadow-sm border border-yellow-200">
                                        <Crown className="w-3 h-3" />
                                    </div>
                                )}

                                {/* Online Status Dot */}
                                <div className={cn(
                                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900",
                                    player.isOnline ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-rose-500"
                                )} />
                            </div>

                            {/* Player Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "font-bold text-sm truncate max-w-[100px]",
                                        isCurrentUser ? "text-yellow-400" : "text-white"
                                    )}>
                                        {player.name}
                                    </span>
                                    {isCurrentUser && (
                                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">ME</span>
                                    )}
                                </div>

                                {/* Bet Amount / Status Text */}
                                <div className="flex items-center gap-2 mt-1">
                                    {bet > 0 ? (
                                        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                            <DollarSign className="w-3 h-3 text-yellow-400" />
                                            <span className="text-xs font-mono text-yellow-400 font-bold">{bet.toLocaleString()}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-white/40 flex items-center gap-1">
                                            {player.isOnline ? (
                                                <span className="text-emerald-400/80">กำลังเล่น</span>
                                            ) : (
                                                <span className="text-rose-400/80 flex items-center gap-1"><WifiOff className="w-3 h-3" /> หลุด</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Cards */}
                        {player.cards && player.cards.length > 0 && (
                            <div className="mt-1 h-[60px] relative flex justify-center items-center">
                                {player.cards.map((card, i) => {
                                    // Logic การหมุนไพ่ให้ดูเป็นธรรมชาติ
                                    const rotate = (i - (player.cards!.length - 1) / 2) * 6;
                                    const yOffset = Math.abs(i - (player.cards!.length - 1) / 2) * 2;

                                    return (
                                        <div
                                            key={i}
                                            className="absolute transition-all duration-300 hover:-translate-y-4 hover:z-50 origin-bottom"
                                            style={{
                                                transform: `translateX(${(i - (player.cards!.length - 1) / 2) * 20}px) translateY(${yOffset}px) rotate(${rotate}deg)`,
                                                zIndex: i
                                            }}
                                        >
                                            <PlayingCard
                                                card={(showCards || isCurrentUser) ? card : undefined}
                                                faceDown={!showCards && !isCurrentUser}
                                                size="sm"
                                                className="shadow-xl"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Card Count Badge (Hidden if showing cards) */}
                        {!showCards && !isCurrentUser && player.cards && player.cards.length > 0 && (
                            <div className="absolute bottom-2 right-2">
                                <Badge variant="outline" className="bg-black/60 border-white/10 text-white/60 text-[10px]">
                                    {player.cards.length} ใบ
                                </Badge>
                            </div>
                        )}

                    </div>
                </CardContent>
            </Card>
        </div>
    )
}