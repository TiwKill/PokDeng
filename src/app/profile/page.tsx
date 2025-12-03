"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getOrCreateProfile, updateProfile, resetStats, AVATARS } from "@/lib/storage"
import type { PlayerProfile } from "@/lib/types"
import { Pencil, RotateCcw, Gamepad2, Trophy, Percent, Flame, Loader2 } from "lucide-react"

export default function ProfilePage() {
    const [profile, setProfile] = useState<PlayerProfile | null>(null)
    const [editName, setEditName] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        setProfile(getOrCreateProfile())
    }, [])

    const handleSaveName = () => {
        if (editName.trim() && profile) {
            const updated = updateProfile({ name: editName.trim() })
            setProfile(updated)
            setIsDialogOpen(false)
        }
    }

    const handleSelectAvatar = (avatar: string) => {
        if (profile) {
            const updated = updateProfile({ avatar })
            setProfile(updated)
        }
    }

    const handleResetStats = () => {
        if (confirm("ต้องการรีเซ็ตสถิติทั้งหมดหรือไม่?")) {
            const updated = resetStats()
            setProfile(updated)
        }
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 py-8">
                <div className="mx-auto max-w-2xl">
                    {/* Profile Header */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-primary p-6">
                            <div className="flex items-center gap-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="hover:scale-110 transition-transform cursor-pointer">
                                            <Avatar className="h-16 w-16 text-4xl border-2 border-primary-foreground/20">
                                                <AvatarFallback className="bg-primary-foreground/10">{profile.avatar}</AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>เลือกอวาตาร์</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-4 gap-4 py-4">
                                            {AVATARS.map((avatar) => (
                                                <button
                                                    key={avatar}
                                                    onClick={() => handleSelectAvatar(avatar)}
                                                    className={`text-4xl p-3 rounded-xl hover:bg-secondary transition-colors ${profile.avatar === avatar ? "bg-secondary ring-2 ring-primary" : ""
                                                        }`}
                                                >
                                                    {avatar}
                                                </button>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-primary-foreground">{profile.name}</h1>
                                    <p className="text-sm text-primary-foreground/70">
                                        เริ่มเล่น: {new Date(profile.createdAt).toLocaleDateString("th-TH")}
                                    </p>
                                </div>

                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" size="icon" onClick={() => setEditName(profile.name)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>แก้ไขชื่อ</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex gap-2 py-4">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="ใส่ชื่อใหม่"
                                                maxLength={20}
                                            />
                                            <Button onClick={handleSaveName}>บันทึก</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <CardTitle className="text-lg">สถิติการเล่น</CardTitle>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-secondary/50">
                                    <CardContent className="p-4 text-center">
                                        <Gamepad2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                        <div className="text-2xl font-bold">{profile.gamesPlayed}</div>
                                        <div className="text-xs text-muted-foreground">เกมที่เล่น</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-secondary/50">
                                    <CardContent className="p-4 text-center">
                                        <Trophy className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                                        <div className="text-2xl font-bold">{profile.wins}</div>
                                        <div className="text-xs text-muted-foreground">ชนะ</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-secondary/50">
                                    <CardContent className="p-4 text-center">
                                        <Percent className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                        <div className="text-2xl font-bold">{winRate}%</div>
                                        <div className="text-xs text-muted-foreground">อัตราชนะ</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-secondary/50">
                                    <CardContent className="p-4 text-center">
                                        <Flame className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                                        <div className="text-2xl font-bold">0</div>
                                        <div className="text-xs text-muted-foreground">ชนะติดต่อกัน</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Separator className="my-6" />

                            <Button variant="ghost" className="text-muted-foreground" onClick={handleResetStats}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                รีเซ็ตสถิติ
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    )
}
