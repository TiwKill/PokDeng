"use client"

import { useState } from "react"
import { usePeer } from "@/lib/peer-context"
import { getOrCreateProfile } from "@/lib/storage"
import { PlayingCard } from "./playing-card"
import { PlayerSlot } from "./player-slot"
import { ChatPanel } from "./chat-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, LogOut, Wifi } from "lucide-react"
import { getHandTypeName, calculatePoints } from "@/lib/game-utils"
import { cn } from "@/lib/utils"

export function GameTable() {
    const { roomState, sendChat, leaveRoom, drawCard, stand } = usePeer()
    const profile = getOrCreateProfile()
    const [isChatOpen, setIsChatOpen] = useState(false)

    if (!roomState || !roomState.gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">กำลังโหลดเกม...</p>
            </div>
        )
    }

    const { gameState } = roomState
    const currentPlayer = gameState.players.find((p) => p.id === profile.id)
    const otherPlayers = gameState.players.filter((p) => p.id !== profile.id)

    // Position other players around the table
    const positions = ["top", "left", "right"] as const

    return (
        <div className="relative min-h-screen bg-green-900">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-background/80 backdrop-blur border-b">
                <Button variant="ghost" size="sm" onClick={leaveRoom}>
                    <LogOut className="mr-2 h-4 w-4" />
                    ออก
                </Button>

                <Badge variant="secondary" className="px-4 py-2 text-sm font-mono">
                    ห้อง: {roomState.roomCode}
                </Badge>

                <div className="flex items-center gap-2 text-sm text-green-500">
                    <Wifi className="h-4 w-4" />
                    <span>เชื่อมต่อแล้ว</span>
                </div>
            </header>

            {/* Game Table */}
            <div className="flex items-center justify-center min-h-screen pt-16 pb-48 px-4">
                <div className="relative w-full max-w-4xl aspect-[16/10]">
                    {/* Table Surface */}
                    <div className="absolute inset-0 rounded-[80px] bg-green-800 border-8 border-green-950 shadow-2xl" />

                    {/* Center Area */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Card className="bg-green-700/50 border-green-600/50">
                            <CardContent className="p-6 text-center">
                                <p className="text-white/70 text-lg">รอบที่ {gameState.round}</p>
                                {gameState.phase === "showdown" && <p className="text-white text-xl font-bold mt-2">เปิดไพ่!</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Other Players */}
                    {otherPlayers.map((player, i) => {
                        const position = positions[i % 3]
                        const positionStyles = {
                            top: "absolute top-4 left-1/2 -translate-x-1/2",
                            left: "absolute left-4 top-1/2 -translate-y-1/2",
                            right: "absolute right-4 top-1/2 -translate-y-1/2",
                        }

                        return (
                            <div key={player.id} className={positionStyles[position]}>
                                <PlayerSlot
                                    player={player}
                                    isHost={player.id === roomState.hostId}
                                    showCards={gameState.phase === "showdown"}
                                    position={position}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Current Player's Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Cards */}
                    {currentPlayer && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                {currentPlayer.cards.map((card, i) => (
                                    <PlayingCard key={i} card={card} size="lg" />
                                ))}
                            </div>

                            <Card className="bg-card/90 backdrop-blur">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <span className="text-2xl font-bold">{calculatePoints(currentPlayer.cards)} แต้ม</span>
                                    <Badge
                                        variant={
                                            currentPlayer.handType === "pok9" || currentPlayer.handType === "pok8" ? "default" : "secondary"
                                        }
                                        className={cn(
                                            currentPlayer.handType === "pok9" || currentPlayer.handType === "pok8"
                                                ? "bg-yellow-500 text-yellow-950"
                                                : "",
                                        )}
                                    >
                                        {getHandTypeName(currentPlayer.handType || "normal")}
                                    </Badge>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            {gameState.phase === "playing" && currentPlayer.cards.length < 3 && (
                                <div className="flex gap-3">
                                    <Button variant="secondary" size="lg" onClick={stand}>
                                        ไม่จั่ว
                                    </Button>
                                    <Button size="lg" onClick={drawCard}>
                                        จั่วไพ่
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Button */}
            <Button
                variant="secondary"
                size="icon"
                className="fixed bottom-24 right-4 h-12 w-12 rounded-full shadow-lg z-40"
                onClick={() => setIsChatOpen(!isChatOpen)}
            >
                <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Chat Panel */}
            <ChatPanel
                messages={roomState.messages}
                currentUserId={profile.id}
                onSend={sendChat}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    )
}
