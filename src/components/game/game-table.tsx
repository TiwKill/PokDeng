"use client"

import { useState, useEffect } from "react"
import { usePeer } from "@/lib/peer-context"
import { getOrCreateProfile } from "@/lib/storage"
import { PlayingCard } from "./playing-card"
import { PlayerSlot } from "./player-slot"
import { ChatPanel } from "./chat-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    MessageCircle, LogOut, Wifi, Loader2, AlertCircle,
    Crown, Users, Clock, Award, DollarSign, RefreshCw,
    Timer, Check, Trophy, X
} from "lucide-react"
import { getHandTypeName, calculatePoints, getHandType } from "@/lib/game-utils"
import { cn } from "@/lib/utils"

export function GameTable() {
    const { roomState, sendChat, leaveRoom, drawCard, stand, isHost, sendMessage, startGame, startNewRound } = usePeer()
    const profile = getOrCreateProfile()
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [gameTimer, setGameTimer] = useState(30)
    const [showResults, setShowResults] = useState(false)
    const [loadingState, setLoadingState] = useState({
        isLoaded: false,
        error: null as string | null,
        retryCount: 0
    })

    // Game timer effect
    useEffect(() => {
        if (!roomState?.gameState || roomState.gameState.phase !== "playing") {
            setGameTimer(30)
            return
        }

        const timer = setInterval(() => {
            setGameTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    // Auto-stand when time runs out
                    if (roomState?.gameState?.currentPlayerIndex !== undefined && roomState.gameState.currentPlayerIndex >= 0) {
                        const currentPlayerIdx = roomState.gameState.currentPlayerIndex
                        const currentPlayer = roomState.gameState.players[currentPlayerIdx]
                        if (currentPlayer?.id === profile.id) {
                            stand()
                        }
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [roomState?.gameState?.phase, roomState?.gameState?.currentPlayerIndex, profile.id, stand])

    // Auto-show results when showdown
    useEffect(() => {
        if (roomState?.gameState?.phase === "showdown") {
            const timer = setTimeout(() => {
                setShowResults(true)
            }, 1000)
            return () => clearTimeout(timer)
        } else {
            setShowResults(false)
        }
    }, [roomState?.gameState?.phase])

    // Debug logging
    useEffect(() => {
        if (roomState) {
            console.log("[GameTable] roomState updated:", roomState)
            console.log("[GameTable] Game Phase:", roomState.gameState?.phase)
            console.log("[GameTable] Current Player Index:", roomState.gameState?.currentPlayerIndex)

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
                <p className="text-white/60 text-sm">รอข้อมูลจากเซิร์ฟเวอร์</p>
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

                        {isHost && (
                            <Button
                                className="w-full h-12 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
                                disabled={roomState.players.length < 2 || !roomState.players.every(p => p.isReady)}
                                onClick={startGame}
                            >
                                <Crown className="mr-2 h-5 w-5" />
                                เริ่มเกม
                            </Button>
                        )}

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
    const dealer = gameState.players[gameState.dealerIndex]

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

    const currentPlayerIndex = gameState.players.findIndex(p => p.id === profile.id)
    const isPlayerTurn = gameState.currentPlayerIndex === currentPlayerIndex
    const canDrawCard = isPlayerTurn &&
        gameState.phase === "playing" &&
        currentPlayer.cards.length < 3 &&
        (currentPlayer.score === undefined || currentPlayer.score < 8) // ไม่ได้ป๊อก 8/9

    // คำนวณผลลัพธ์
    const calculateResult = (player: typeof currentPlayer) => {
        if (gameState.phase !== "showdown" || !dealer) return 0

        const playerScore = calculatePoints(player.cards)
        const dealerScore = calculatePoints(dealer.cards)
        const playerHandType = getHandType(player.cards)
        const dealerHandType = getHandType(dealer.cards)

        // เปรียบเทียบประเภทไพ่
        const typeRank: Record<string, number> = {
            "pok9": 4, "pok8": 3, "triple": 2, "straight": 1, "samColor": 1, "normal": 0
        }

        const playerTypeRank = typeRank[playerHandType] || 0
        const dealerTypeRank = typeRank[dealerHandType] || 0

        if (playerTypeRank > dealerTypeRank) return 1  // ผู้เล่นชนะ
        if (playerTypeRank < dealerTypeRank) return -1 // ผู้เล่นแพ้

        // ถ้าประเภทเดียวกัน เปรียบเทียบแต้ม
        if (playerScore > dealerScore) return 1
        if (playerScore < dealerScore) return -1

        return 0 // เสมอ
    }

    const playerResult = calculateResult(currentPlayer)

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
                        {otherPlayers.filter((_, i) => i < 3).map((player) => (
                            <div key={player.id} className="w-56">
                                <PlayerSlot
                                    player={player}
                                    isHost={player.id === roomState.hostId}
                                    showCards={gameState.phase === "showdown" || player.cards.length === 0}
                                    position="top"
                                    isTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === player.id)}
                                    bet={player.bet}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Top Players */}
                <div className="lg:hidden mb-6">
                    <div className="overflow-x-auto pb-2">
                        <div className="flex gap-3 min-w-max px-2">
                            {otherPlayers.map((player) => (
                                <div key={player.id} className="w-40">
                                    <PlayerSlot
                                        player={player}
                                        isHost={player.id === roomState.hostId}
                                        showCards={gameState.phase === "showdown" || player.cards.length === 0}
                                        position="top"
                                        isTurn={gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === player.id)}
                                        bet={player.bet}
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

                                    {gameState.phase === "playing" && gameState.currentPlayerIndex === 0 && (
                                        <Alert className="mt-4 max-w-sm mx-auto bg-gradient-to-r from-yellow-900/30 to-amber-800/30 border-yellow-500/30">
                                            <AlertDescription className="text-yellow-200 font-medium flex items-center justify-center gap-2">
                                                <Crown className="h-4 w-4" />
                                                ตาเจ้ามือกำลังเล่น...
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {gameState.phase === "playing" && isPlayerTurn && (
                                        <Alert className="mt-4 max-w-sm mx-auto bg-gradient-to-r from-amber-900/30 to-amber-800/30 border-amber-500/30">
                                            <AlertDescription className="text-amber-200 font-medium flex items-center justify-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                ⚡ ตาคุณ! เลือกจั่วหรือไม่จั่ว
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dealer Info */}
                {dealer && dealer.id !== profile.id && (
                    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-30">
                        <div className="bg-gradient-to-r from-yellow-900/80 to-amber-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-500/30">
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-400" />
                                <span className="font-medium text-sm">เจ้ามือ: {dealer.name}</span>
                                {gameState.phase === "showdown" && (
                                    <Badge className="ml-2 bg-white/20 text-xs">
                                        {dealer.score} แต้ม
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                    {isPlayerTurn && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                                            <Clock className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{currentPlayer.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                        <span>เงิน: <span className="font-bold text-yellow-400">{currentPlayer.balance || 1000}</span></span>
                                        <span>•</span>
                                        <span>แต้ม: <span className="font-bold text-emerald-400">{currentPlayer.score || 0}</span></span>
                                        {currentPlayer.bet > 0 && (
                                            <>
                                                <span>•</span>
                                                <span>เดิมพัน: <span className="font-bold text-amber-400">{currentPlayer.bet}</span></span>
                                            </>
                                        )}
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
                                {currentPlayer.cards.length < 3 && gameState.phase === "playing" && canDrawCard && (
                                    <div className="w-20 h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-emerald-400/50 hover:bg-emerald-400/10 transition-colors cursor-pointer">
                                        <span className="text-white/40 text-2xl">?</span>
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
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold",
                                        playerResult > 0 ? "bg-gradient-to-r from-green-600 to-emerald-600" :
                                            playerResult < 0 ? "bg-gradient-to-r from-red-600 to-rose-600" :
                                                "bg-gradient-to-r from-gray-600 to-gray-700"
                                    )}>
                                        <Award className="h-4 w-4" />
                                        <span>
                                            {playerResult > 0 ? "คุณชนะ!" :
                                                playerResult < 0 ? "คุณแพ้!" : "เสมอ!"}
                                        </span>
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
            </div>

            {/* Start New Round Button (Host only during showdown) */}
            {gameState.phase === "showdown" && isHost && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
                    <Button
                        size="lg"
                        onClick={startNewRound}
                        className="animate-bounce bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold px-8 py-6 shadow-xl text-lg"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        เริ่มรอบต่อไป
                    </Button>
                </div>
            )}

            {/* Results Modal */}
            {showResults && gameState.phase === "showdown" && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-2xl p-6 max-w-md w-full border-2 border-emerald-500 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
                                <Trophy className="h-6 w-6" />
                                ผลการแข่งขัน
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowResults(false)}
                                className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                            {gameState.players.map((player) => {
                                const isCurrent = player.id === profile.id
                                const isDealer = player.id === dealer?.id
                                const result = calculateResult(player)
                                const wonAmount = result > 0 ? gameState.currentBet : result < 0 ? -gameState.currentBet : 0

                                return (
                                    <div key={player.id} className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border",
                                        isCurrent ? "bg-emerald-900/50 border-emerald-500/50" :
                                            "bg-white/5 border-white/10"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                                                    isDealer ? "bg-gradient-to-br from-yellow-500 to-amber-500" :
                                                        "bg-gradient-to-br from-emerald-500 to-teal-500"
                                                )}>
                                                    {player.avatar}
                                                </div>
                                                {isDealer && (
                                                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {player.name}
                                                    {isCurrent && " (คุณ)"}
                                                    {isDealer && " (เจ้ามือ)"}
                                                </p>
                                                <p className="text-sm text-white/70">
                                                    {getHandTypeName(getHandType(player.cards))} - {calculatePoints(player.cards)} แต้ม
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold text-lg",
                                            result > 0 ? "text-green-400" :
                                                result < 0 ? "text-red-400" : "text-white/70"
                                        )}>
                                            {result > 0 ? `+${wonAmount}` :
                                                result < 0 ? `${wonAmount}` : "0"}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="text-center text-white/60 text-sm mb-4">
                            ยอดเงินของคุณ: <span className="font-bold text-yellow-300">{currentPlayer.balance || 1000}</span>
                        </div>

                        {isHost ? (
                            <Button
                                onClick={startNewRound}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-lg font-bold"
                            >
                                เริ่มรอบต่อไป
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowResults(false)}
                                className="w-full border-white/20 text-white hover:bg-white/10 h-12"
                            >
                                ปิด
                            </Button>
                        )}
                    </div>
                </div>
            )}

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