"use client"

import { useState } from "react"
import { usePeer } from "@/lib/peer-context"
import { getOrCreateProfile } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerSlot } from "./player-slot"
import { Copy, Users, Check, Loader2, Crown } from "lucide-react"

export function WaitingRoom() {
    const { roomState, isHost, setReady, startGame } = usePeer()
    const profile = getOrCreateProfile()
    const [copied, setCopied] = useState(false)

    if (!roomState) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentPlayer = roomState.players.find((p) => p.id === profile.id)
    const isReady = currentPlayer?.isReady || false
    const allReady = roomState.players.length >= 2 && roomState.players.every((p) => p.isReady)
    const canStart = isHost && allReady

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomState.roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Create 6 player slots
    const slots = Array(6)
        .fill(null)
        .map((_, i) => roomState.players[i] || null)

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">{isHost ? "ห้องของคุณ" : "เข้าร่วมห้อง"}</h1>
                <p className="text-muted-foreground mt-1">รอผู้เล่นเข้าร่วม ({roomState.players.length}/6)</p>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {slots.map((player, i) => (
                    <PlayerSlot
                        key={i}
                        player={player || undefined}
                        isCurrentUser={player?.id === profile.id}
                        isHost={player?.id === roomState.hostId}
                        position="bottom"
                    />
                ))}
            </div>

            {/* Invite Section */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">เชิญเพื่อนเข้าร่วม</CardTitle>
                    </div>
                    <CardDescription>แชร์รหัสห้องนี้ให้เพื่อนเพื่อเข้าร่วมเกม</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center justify-center h-12 rounded-lg bg-secondary text-xl font-mono font-bold tracking-widest">
                            {roomState.roomCode}
                        </div>
                        <Button variant="secondary" size="icon" className="h-12 w-12" onClick={handleCopyCode}>
                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
                <Button variant={isReady ? "secondary" : "default"} className="w-full h-12" onClick={() => setReady(!isReady)}>
                    {isReady ? (
                        <>
                            <Check className="mr-2 h-5 w-5 text-green-500" />
                            พร้อมแล้ว
                        </>
                    ) : (
                        "กดเพื่อพร้อม"
                    )}
                </Button>

                {isHost && (
                    <Button className="w-full h-12" disabled={!canStart} onClick={startGame}>
                        <Crown className="mr-2 h-5 w-5" />
                        {canStart
                            ? "เริ่มเกม!"
                            : `รอผู้เล่นพร้อม (${roomState.players.filter((p) => p.isReady).length}/${roomState.players.length})`}
                    </Button>
                )}
            </div>
        </div>
    )
}
