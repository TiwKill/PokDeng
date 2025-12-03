"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getOrCreateProfile, updateProfile } from "@/lib/storage"
import { generateRoomCode } from "@/lib/game-utils"
import type { PlayerProfile } from "@/lib/types"
import { Plus, Users, Crown, Copy, RefreshCw, ArrowLeft, Loader2, Check, Info } from "lucide-react"

type LobbyView = "main" | "create" | "join"

export default function LobbyPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<PlayerProfile | null>(null)
    const [view, setView] = useState<LobbyView>("main")
    const [roomCode, setRoomCode] = useState("")
    const [joinCode, setJoinCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [editName, setEditName] = useState("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setProfile(getOrCreateProfile())
    }, [])

    const handleGenerateCode = () => {
        setRoomCode(generateRoomCode())
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCreateRoom = () => {
        if (roomCode) {
            setIsLoading(true)
            router.push(`/game/${roomCode}?host=true`)
        }
    }

    const handleJoinRoom = () => {
        if (joinCode.trim()) {
            setIsLoading(true)
            router.push(`/game/${joinCode.trim().toUpperCase()}`)
        }
    }

    const handleSaveName = () => {
        if (editName.trim() && profile) {
            const updated = updateProfile({ name: editName.trim() })
            setProfile(updated)
            setIsEditingName(false)
        }
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 py-8 flex flex-col justify-center">
                <div className="mx-auto max-w-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold">ห้องเกม</h1>
                        <p className="text-muted-foreground mt-2">สร้างห้องใหม่หรือเข้าร่วมห้องที่มีอยู่</p>
                    </div>

                    {/* Profile Card */}
                    <Card className="mb-8">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 text-2xl">
                                        <AvatarFallback className="bg-primary/10">{profile.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 w-32"
                                                    maxLength={20}
                                                    autoFocus
                                                />
                                                <Button size="sm" onClick={handleSaveName}>
                                                    บันทึก
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                                                    ยกเลิก
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="font-semibold">{profile.name}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            เล่นแล้ว {profile.gamesPlayed} เกม | ชนะ {profile.wins} เกม
                                        </p>
                                    </div>
                                </div>
                                {!isEditingName && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditName(profile.name)
                                            setIsEditingName(true)
                                        }}
                                    >
                                        แก้ไข
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main View */}
                    {view === "main" && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card
                                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                                onClick={() => {
                                    handleGenerateCode()
                                    setView("create")
                                }}
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Plus className="h-7 w-7 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">สร้างห้อง</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">สร้างห้องใหม่และแชร์รหัสให้เพื่อน</p>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
                                onClick={() => setView("join")}
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                        <Users className="h-7 w-7 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold">เข้าร่วมห้อง</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">ใส่รหัสห้องเพื่อเข้าร่วมเกม</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Create Room View */}
                    {view === "create" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-yellow-500" />
                                    <CardTitle>สร้างห้องใหม่</CardTitle>
                                </div>
                                <CardDescription>แชร์รหัสห้องให้เพื่อนเพื่อเข้าร่วมเกม</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">รหัสห้องของคุณ</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex items-center justify-center h-14 rounded-lg bg-secondary text-2xl font-mono font-bold tracking-widest">
                                            {roomCode}
                                        </div>
                                        <Button variant="secondary" size="icon" className="h-14 w-14" onClick={handleCopyCode}>
                                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                        </Button>
                                        <Button variant="secondary" size="icon" className="h-14 w-14" onClick={handleGenerateCode}>
                                            <RefreshCw className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        <span className="font-medium">รอผู้เล่น 2-6 คน</span>
                                        <br />
                                        <span className="text-muted-foreground">เกมจะเริ่มเมื่อผู้เล่นพร้อมทุกคน</span>
                                    </AlertDescription>
                                </Alert>

                                <Separator />

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setView("main")}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        ย้อนกลับ
                                    </Button>
                                    <Button className="flex-1" onClick={handleCreateRoom} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                        สร้างห้อง
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Join Room View */}
                    {view === "join" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <CardTitle>เข้าร่วมห้อง</CardTitle>
                                </div>
                                <CardDescription>ใส่รหัสห้อง 6 ตัวอักษรเพื่อเข้าร่วมเกม</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">รหัสห้อง</p>
                                    <Input
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="ใส่รหัสห้อง 6 ตัวอักษร"
                                        className="text-center text-xl font-mono tracking-widest h-14"
                                        maxLength={6}
                                    />
                                </div>

                                <Separator />

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setView("main")}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        ย้อนกลับ
                                    </Button>
                                    <Button className="flex-1" onClick={handleJoinRoom} disabled={joinCode.length !== 6 || isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                        เข้าร่วม
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
