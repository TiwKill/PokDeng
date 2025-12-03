"use client"

import { useState, useEffect } from "react"
import { usePeer } from "@/lib/peer-context"
import { getOrCreateProfile } from "@/lib/storage"
import { PlayingCard } from "./playing-card"
import { PlayerSlot } from "./player-slot"
import { ChatPanel } from "./chat-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, LogOut, Wifi, Loader2, AlertCircle } from "lucide-react"
import { getHandTypeName, calculatePoints } from "@/lib/game-utils"
import { cn } from "@/lib/utils"

export function GameTable() {
    const { roomState, sendChat, leaveRoom, drawCard, stand, isHost } = usePeer()
    const profile = getOrCreateProfile()
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [loadingState, setLoadingState] = useState({
        isLoaded: false,
        error: null as string | null,
        retryCount: 0
    })

    // Debug logging
    useEffect(() => {
        console.log("[GameTable] roomState:", roomState)
        console.log("[GameTable] isHost:", isHost)
        console.log("[GameTable] profile.id:", profile.id)
        
        if (roomState) {
            console.log("[GameTable] roomState.gameState:", roomState.gameState)
            console.log("[GameTable] Players in room:", roomState.players.map(p => ({ id: p.id, name: p.name })))
            
            // Check if current player is in the room
            const currentPlayerInRoom = roomState.players.some(p => p.id === profile.id)
            console.log("[GameTable] Current player in room:", currentPlayerInRoom)
            
            if (!currentPlayerInRoom && !loadingState.isLoaded) {
                console.log("[GameTable] Player not found in room, waiting for sync...")
                setLoadingState(prev => ({
                    ...prev,
                    error: "ไม่พบผู้เล่นในห้องนี้ รอการอัพเดต..."
                }))
            } else if (roomState.gameState && !loadingState.isLoaded) {
                console.log("[GameTable] Game state loaded!")
                setLoadingState({
                    isLoaded: true,
                    error: null,
                    retryCount: 0
                })
            }
        }
    }, [roomState, profile.id, isHost, loadingState.isLoaded])

    // ถ้ายังไม่มี roomState หรือ gameState
    if (!roomState) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">กำลังโหลดข้อมูลห้อง...</p>
                <p className="text-sm text-muted-foreground">รหัสห้อง: {window.location.pathname.split('/').pop()}</p>
            </div>
        )
    }

    // ถ้ามี roomState แต่ไม่มี gameState (ยังไม่ได้เริ่มเกม)
    if (!roomState.gameState) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">รอเริ่มเกม</h2>
                    <p className="text-muted-foreground mb-4">
                        ผู้เล่นในห้อง ({roomState.players.length}/6 คน)
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                        {roomState.players.map((player) => (
                            <Badge key={player.id} variant="secondary" className="px-3 py-2">
                                <span className="font-medium">{player.name}</span>
                                {player.id === roomState.hostId && (
                                    <span className="ml-2 text-yellow-500">👑</span>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        {isHost 
                            ? "คุณเป็น Host คลิก 'เริ่มเกม' ที่หน้า Waiting Room" 
                            : "รอ Host เริ่มเกม..."}
                    </p>
                    
                    {loadingState.error && (
                        <div className="flex items-center gap-2 text-amber-500">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{loadingState.error}</span>
                        </div>
                    )}
                </div>

                <Button variant="outline" onClick={leaveRoom}>
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากห้อง
                </Button>
            </div>
        )
    }

    const { gameState } = roomState
    const currentPlayer = gameState.players.find((p) => p.id === profile.id)
    const otherPlayers = gameState.players.filter((p) => p.id !== profile.id)

    // ถ้าไม่เจอตัวเองในเกม (อาจเป็นเพราะ sync ยังไม่เสร็จ)
    if (!currentPlayer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <div className="text-center">
                    <p className="text-lg font-medium mb-2">ไม่พบข้อมูลผู้เล่นของคุณในเกม</p>
                    <p className="text-muted-foreground text-sm mb-4">
                        อาจเป็นเพราะการเชื่อมต่อมีปัญหา
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        โหลดใหม่
                    </Button>
                    <Button onClick={leaveRoom}>
                        <LogOut className="mr-2 h-4 w-4" />
                        ออกจากห้อง
                    </Button>
                </div>
            </div>
        )
    }

    // Position other players around the table
    const positions = ["top", "left", "right"] as const

    return (
        <div className="relative min-h-screen bg-green-900">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-background/80 backdrop-blur border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={leaveRoom}>
                        <LogOut className="mr-2 h-4 w-4" />
                        ออก
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">ผู้เล่น:</span>
                        <span className="font-medium">{roomState.players.length} คน</span>
                    </div>
                </div>

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
                                <p className="text-white text-xl font-bold mt-2">
                                    {gameState.phase === "playing" ? "กำลังเล่น..." : "เปิดไพ่!"}
                                </p>
                                {isHost && (
                                    <p className="text-white/60 text-sm mt-2">👑 คุณเป็นเจ้ามือ</p>
                                )}
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
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            {currentPlayer.cards.map((card, i) => (
                                <PlayingCard key={i} card={card} size="lg" />
                            ))}
                        </div>

                        <Card className="bg-card/90 backdrop-blur">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{currentPlayer.name}</span>
                                    <span className="text-2xl font-bold text-primary mt-1">
                                        {calculatePoints(currentPlayer.cards)} แต้ม
                                    </span>
                                </div>
                                <Badge
                                    variant={
                                        currentPlayer.handType === "pok9" || currentPlayer.handType === "pok8" ? "default" : "secondary"
                                    }
                                    className={cn(
                                        "text-lg px-4 py-2",
                                        currentPlayer.handType === "pok9" || currentPlayer.handType === "pok8"
                                            ? "bg-yellow-500 text-yellow-950 hover:bg-yellow-600"
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
                        
                        {gameState.phase === "showdown" && (
                            <div className="text-center">
                                <p className="text-white/80 mb-2">รอการคำนวณผล...</p>
                                {isHost && (
                                    <p className="text-white/60 text-sm">(คุณเป็น Host ควรเริ่มรอบถัดไป)</p>
                                )}
                            </div>
                        )}
                    </div>
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