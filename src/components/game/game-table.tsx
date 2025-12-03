"use client"

import { useState, useEffect, useMemo } from "react"
import { usePeer } from "@/lib/peer-context"
import { getOrCreateProfile } from "@/lib/storage"
import { PlayingCard } from "./playing-card"
import { PlayerSlot } from "./player-slot"
import { ChatPanel } from "./chat-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  MessageCircle, LogOut, Wifi, Loader2, AlertCircle, 
  Crown, Users, Clock, Award, DollarSign, RefreshCw,
  Volume2, VolumeX, Settings, Info, Timer,
  Check
} from "lucide-react"
import { getHandTypeName, calculatePoints } from "@/lib/game-utils"
import { cn } from "@/lib/utils"

export function GameTable() {
    const { roomState, sendChat, leaveRoom, drawCard, stand, isHost, sendMessage } = usePeer()
    const profile = getOrCreateProfile()
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isSoundOn, setIsSoundOn] = useState(true)
    const [gameTimer, setGameTimer] = useState(30)
    const [loadingState, setLoadingState] = useState({
        isLoaded: false,
        error: null as string | null,
        retryCount: 0
    })

    // Game timer effect
    useEffect(() => {
        if (!roomState?.gameState || roomState.gameState.phase !== "playing") return
        
        const timer = setInterval(() => {
            setGameTimer(prev => {
                if (prev <= 0) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [roomState?.gameState?.phase])

    // Debug logging
    useEffect(() => {
        if (roomState) {
            console.log("[GameTable] roomState updated:", roomState)
            
            // Check if current player is in the room
            const currentPlayerInRoom = roomState.players.some(p => p.id === profile.id)
            
            if (!currentPlayerInRoom && !loadingState.isLoaded) {
                setLoadingState(prev => ({
                    ...prev,
                    error: "กำลังอัพเดตข้อมูลผู้เล่น..."
                }))
            } else if (roomState.gameState && !loadingState.isLoaded) {
                setLoadingState({
                    isLoaded: true,
                    error: null,
                    retryCount: 0
                })
            }
        }
    }, [roomState, profile.id, loadingState.isLoaded])

    // ถ้ายังไม่มี roomState
    if (!roomState) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-green-900 to-emerald-950 p-4">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-400 relative" />
                </div>
                <p className="text-white/80 text-lg font-medium">กำลังเชื่อมต่อกับห้องเกม...</p>
                <p className="text-white/60 text-sm">รหัสห้อง: {window.location.pathname.split('/').pop()}</p>
            </div>
        )
    }

    // ถ้ายังไม่ได้เริ่มเกม
    if (!roomState.gameState) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-gradient-to-b from-green-900 to-emerald-950">
                <div className="text-center max-w-md">
                    <div className="inline-block p-4 rounded-2xl bg-emerald-900/30 mb-4">
                        <Crown className="h-12 w-12 text-yellow-400 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">รอเริ่มเกม</h2>
                    <p className="text-white/70 mb-6">
                        ผู้เล่นในห้อง <span className="font-bold text-emerald-300">{roomState.players.length}</span>/6 คน
                    </p>
                    
                    {/* Players grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        {roomState.players.map((player) => (
                            <div key={player.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                        {player.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate text-sm">{player.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {player.id === roomState.hostId && (
                                                <Crown className="w-3 h-3 text-yellow-400" />
                                            )}
                                            <div className={`w-2 h-2 rounded-full ${player.isReady ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            <span className="text-xs text-white/60">
                                                {player.isReady ? 'พร้อม' : 'รอ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {roomState.players.length < 2 && (
                        <Alert className="mb-4 bg-amber-900/20 border-amber-500/30">
                            <AlertCircle className="h-4 w-4 text-amber-400" />
                            <AlertDescription className="text-amber-200">
                                ต้องการผู้เล่นอย่างน้อย 2 คนเพื่อเริ่มเกม
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <Button 
                            variant={roomState.players.some(p => p.id === profile.id && p.isReady) ? "secondary" : "default"} 
                            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            onClick={() => {
                                const isReady = roomState.players.some(p => p.id === profile.id && p.isReady)
                                sendMessage({
                                    type: "ready",
                                    payload: { playerId: profile.id, ready: !isReady },
                                    senderId: profile.id,
                                    senderName: profile.name
                                })
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {roomState.players.some(p => p.id === profile.id && p.isReady) ? (
                                    <>
                                        <Check className="h-5 w-5 text-green-400" />
                                        <span>ยกเลิกสถานะพร้อม</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span>กดเพื่อพร้อม</span>
                                    </>
                                )}
                            </div>
                        </Button>

                        <Button 
                            variant="outline" 
                            onClick={leaveRoom}
                            className="w-full h-12 border-white/20 text-white hover:bg-white/10"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            ออกจากห้อง
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const { gameState } = roomState
    const currentPlayer = gameState.players.find((p) => p.id === profile.id)
    const otherPlayers = gameState.players.filter((p) => p.id !== profile.id)

    // ถ้าไม่เจอตัวเองในเกม
    if (!currentPlayer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-gradient-to-b from-green-900 to-emerald-950">
                <AlertCircle className="h-16 w-16 text-amber-400" />
                <div className="text-center max-w-md">
                    <h3 className="text-xl font-bold text-white mb-2">ไม่พบข้อมูลผู้เล่นของคุณ</h3>
                    <p className="text-white/70 mb-6">
                        ระบบกำลังอัพเดตข้อมูล กรุณารอสักครู่หรือลองใหม่อีกครั้ง
                    </p>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            โหลดใหม่
                        </Button>
                        <Button 
                            onClick={leaveRoom}
                            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            ออก
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const isPlayerTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === profile.id)
    const canDrawCard = isPlayerTurn && gameState.phase === "playing" && currentPlayer.cards.length < 3

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-900 to-emerald-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-green-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={leaveRoom}
                            className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">ออก</span>
                        </Button>
                        
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <Users className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium">{roomState.players.length}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <DollarSign className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium">{gameState.currentBet}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <div className="font-mono font-bold text-lg tracking-widest">{roomState.roomCode}</div>
                            <div className="text-xs text-white/60">รหัสห้อง</div>
                        </div>
                        
                        <div className="h-8 w-px bg-white/20" />
                        
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isHost ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                            <span className="text-sm">{isHost ? 'Host' : 'ผู้เล่น'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSoundOn(!isSoundOn)}
                            className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                            {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </Button>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Wifi className="h-4 w-4" />
                            <span className="text-sm">เชื่อมต่อ</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Game Area */}
            <main className="py-4 px-2 sm:px-4">
                {/* Top Players (for desktop) */}
                <div className="hidden lg:flex justify-center mb-8">
                    <div className="flex gap-6">
                        {otherPlayers.filter((_, i) => i < 3).map((player, i) => (
                            <div key={player.id} className="w-56">
                                <PlayerSlot
                                    player={player}
                                    isHost={player.id === roomState.hostId}
                                    showCards={gameState.phase === "showdown"}
                                    position="top"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Top Players */}
                <div className="lg:hidden mb-6">
                    <div className="overflow-x-auto pb-2">
                        <div className="flex gap-3 min-w-max px-2">
                            {otherPlayers.map((player, i) => (
                                <div key={player.id} className="w-40">
                                    <PlayerSlot
                                        player={player}
                                        isHost={player.id === roomState.hostId}
                                        showCards={gameState.phase === "showdown"}
                                        position="top"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Game Table Center */}
                <div className="relative mb-24 sm:mb-32">
                    {/* Table Surface */}
                    <div className="max-w-4xl mx-auto">
                        <div className="relative aspect-[16/9] rounded-[40px] sm:rounded-[60px] bg-gradient-to-br from-emerald-800 to-green-900 border-4 sm:border-8 border-emerald-950 shadow-2xl overflow-hidden">
                            {/* Table Pattern */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
                            
                            {/* Center Info */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 bg-black/30 rounded-full">
                                        <Timer className="h-4 w-4 text-emerald-400" />
                                        <span className="font-mono font-bold">{gameTimer}</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-1">รอบที่ {gameState.round}</h2>
                                    <div className="flex items-center justify-center gap-3">
                                        <Badge variant="secondary" className="bg-white/10 text-white">
                                            <DollarSign className="h-3 w-3 mr-1" />
                                            เดิมพัน: {gameState.currentBet}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-white/10 text-white">
                                            <Users className="h-3 w-3 mr-1" />
                                            {gameState.players.length} คน
                                        </Badge>
                                    </div>
                                    {gameState.phase === "playing" && isPlayerTurn && (
                                        <Alert className="mt-4 max-w-sm mx-auto bg-gradient-to-r from-amber-900/30 to-amber-800/30 border-amber-500/30">
                                            <AlertDescription className="text-amber-200 font-medium">
                                                ⚡ ตาคุณ! เลือกจั่วหรือไม่จั่ว
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Player Area */}
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-green-950 via-green-950/95 to-transparent pt-8 pb-4 px-2 sm:px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Player Info */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                                        {currentPlayer.avatar}
                                    </div>
                                    {isHost && (
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                            <Crown className="h-3 w-3 text-yellow-950" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{currentPlayer.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                        <span>เงิน: <span className="font-bold text-yellow-400">1,000</span></span>
                                        <span>•</span>
                                        <span>แต้ม: <span className="font-bold text-emerald-400">{calculatePoints(currentPlayer.cards)}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1" />

                            <div className="flex items-center gap-2">
                                <Badge className={cn(
                                    "px-4 py-2 text-base",
                                    currentPlayer.handType === "pok9" || currentPlayer.handType === "pok8"
                                        ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-white"
                                        : "bg-white/10 text-white"
                                )}>
                                    {getHandTypeName(currentPlayer.handType || "normal")}
                                </Badge>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-2 sm:gap-4">
                                {currentPlayer.cards.map((card, i) => (
                                    <PlayingCard key={i} card={card} size="lg" />
                                ))}
                                {currentPlayer.cards.length < 3 && gameState.phase === "playing" && (
                                    <div className="w-20 h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <span className="text-white/40">?</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {gameState.phase === "playing" && canDrawCard && (
                                <div className="flex gap-3 mt-2">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={stand}
                                        className="px-8 h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900"
                                    >
                                        <span className="font-bold">ไม่จั่ว</span>
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={drawCard}
                                        className="px-8 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                    >
                                        <span className="font-bold">จั่วไพ่</span>
                                    </Button>
                                </div>
                            )}

                            {gameState.phase === "showdown" && (
                                <div className="text-center py-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                                        <Award className="h-4 w-4 text-yellow-400" />
                                        <span className="font-medium">กำลังเปิดไพ่...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Action Buttons */}
            <div className="fixed right-4 bottom-24 flex flex-col gap-2 z-40">
                <Button
                    size="icon"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg hover:from-emerald-700 hover:to-teal-700"
                >
                    <MessageCircle className="h-5 w-5" />
                </Button>
                
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </div>

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