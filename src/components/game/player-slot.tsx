"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { PlayingCard } from "./playing-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Wifi } from "lucide-react"

interface PlayerSlotProps {
    player?: Player
    isCurrentUser?: boolean
    isHost?: boolean
    showCards?: boolean
    position: "top" | "left" | "right" | "bottom"
}

export function PlayerSlot({ player, isCurrentUser, isHost, showCards, position }: PlayerSlotProps) {
    const positionClasses = {
        top: "flex-col",
        bottom: "flex-col-reverse",
        left: "flex-row",
        right: "flex-row-reverse",
    }

    if (!player) {
        return (
            <Card className="border-dashed border-2 border-muted-foreground/30 bg-transparent">
                <CardContent className="flex flex-col items-center gap-2 p-4">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted">
                            <User className="w-6 h-6 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">รอผู้เล่น...</span>
                    <Badge variant="outline" className="text-xs">
                        ว่าง
                    </Badge>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card
            className={cn(
                "transition-all",
                isCurrentUser && "ring-2 ring-yellow-500 bg-yellow-500/5",
                player.isReady && !isCurrentUser && "ring-2 ring-green-500 bg-green-500/5",
            )}
        >
            <CardContent className={cn("flex items-center gap-3 p-4", positionClasses[position])}>
                <div className="relative flex flex-col items-center gap-2">
                    {/* Badges */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {isHost && <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">HOST</Badge>}
                        {isCurrentUser && <Badge className="bg-blue-500 hover:bg-blue-500">คุณ</Badge>}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 text-2xl mt-2">
                        <AvatarFallback className="bg-primary/10">{player.avatar}</AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <span className="font-medium text-sm">
                        {player.name}
                        {isCurrentUser && <span className="text-muted-foreground"> (คุณ)</span>}
                    </span>

                    {/* Status */}
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={cn("flex items-center gap-1", player.isOnline ? "text-green-500" : "text-muted-foreground")}
                        >
                            <Wifi className="w-3 h-3" />
                            {player.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                        </span>
                        {player.isReady && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-500 hover:bg-green-500/20">
                                พร้อม
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Cards */}
                {player.cards && player.cards.length > 0 && (
                    <div className="relative flex gap-1">
                        {player.cards.map((card, i) => (
                            <PlayingCard
                                key={i}
                                card={showCards || isCurrentUser ? card : undefined}
                                faceDown={!showCards && !isCurrentUser}
                                size="sm"
                            />
                        ))}
                        {!showCards && !isCurrentUser && (
                            <Badge className="absolute -bottom-2 -right-2 h-6 w-6 p-0 flex items-center justify-center rounded-full">
                                {player.cards.length}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
