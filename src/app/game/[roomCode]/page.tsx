"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PeerProvider, usePeer } from "@/lib/peer-context"
import { WaitingRoom } from "@/components/game/waiting-room"
import { GameTable } from "@/components/game/game-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Wifi, WifiOff, Loader2 } from "lucide-react"

function GameContent({ roomCode }: { roomCode: string }) {
    const router = useRouter()
    const { isConnected, roomState, joinRoom, leaveRoom, isHost } = usePeer()
    const [isJoining, setIsJoining] = useState(true)
    const [joinError, setJoinError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        async function tryJoin() {
            if (!isHost && isConnected) {
                const hostPeerId = `pokdeng-${roomCode}`
                const success = await joinRoom(hostPeerId)
                if (!success) {
                    setJoinError("ไม่พบห้องนี้หรือห้องเต็มแล้ว")
                }
                setIsJoining(false)
            } else if (isHost && isConnected) {
                setIsJoining(false)
            }
        }

        if (isConnected) {
            tryJoin()
        }
    }, [isConnected, isHost, roomCode, joinRoom])

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleLeave = () => {
        leaveRoom()
        router.push("/lobby")
    }

    if (!isConnected || isJoining) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">กำลังเชื่อมต่อ...</p>
            </div>
        )
    }

    if (joinError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <WifiOff className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">{joinError}</p>
                <Button onClick={() => router.push("/lobby")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    กลับไปห้องเกม
                </Button>
            </div>
        )
    }

    const header = (
        <header className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 bg-background/80 backdrop-blur border-b border-border z-50">
            <Button variant="ghost" size="sm" onClick={handleLeave}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                ออกจากห้อง
            </Button>

            <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
                <span className="text-sm text-muted-foreground">ห้อง:</span>
                <span className="font-mono font-bold">{roomCode}</span>
                <Copy className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                    <>
                        <Wifi className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">เชื่อมต่อแล้ว</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">ไม่ได้เชื่อมต่อ</span>
                    </>
                )}
            </div>
        </header>
    )

    const isGameStarted = roomState?.gameState !== null

    if (isGameStarted) {
        return <GameTable />
    }

    return (
        <div className="min-h-screen pt-16">
            {header}
            <WaitingRoom />
        </div>
    )
}

export default function GamePage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const roomCode = params.roomCode as string
    const isHost = searchParams.get("host") === "true"

    return (
        <PeerProvider roomCode={roomCode} isHost={isHost}>
            <GameContent roomCode={roomCode} />
        </PeerProvider>
    )
}
