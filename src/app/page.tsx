import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Gamepad2, Users, Shield, Zap, Globe, ArrowRight } from "lucide-react"

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-16 md:py-24 lg:py-32">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="outline" className="mb-6 gap-2 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
                            <Zap className="h-4 w-4 text-primary" />
                            <span>Phase 1: P2P Multiplayer</span>
                        </Badge>

                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
                            เล่นเกมไพ่ <span className="text-primary">Pok9</span> ออนไลน์
                        </h1>

                        <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto text-balance">
                            เล่นกับเพื่อนได้ทันที ไม่ต้องลงทะเบียน ไม่ต้องดาวน์โหลด แค่แชร์รหัสห้องก็เล่นได้เลย
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" asChild className="h-12 px-8 text-base">
                                <Link href="/lobby">
                                    <Gamepad2 className="mr-2 h-5 w-5" />
                                    เริ่มเล่นเลย
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base bg-transparent">
                                <Link href="/how-to-play">วิธีเล่น</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold md:text-4xl">2-6</div>
                                <div className="text-sm text-muted-foreground mt-1">ผู้เล่น/ห้อง</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold md:text-4xl">52</div>
                                <div className="text-sm text-muted-foreground mt-1">ไพ่</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold md:text-4xl">P2P</div>
                                <div className="text-sm text-muted-foreground mt-1">เชื่อมต่อ</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold md:text-4xl">0฿</div>
                                <div className="text-sm text-muted-foreground mt-1">ฟรีตลอด</div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Features Section */}
                <section className="border-t border-border/40 bg-card/30 py-16 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">ทำไมต้องเลือก Pok9?</h2>
                        <p className="mt-4 text-muted-foreground">เราออกแบบมาให้เล่นง่าย เร็ว และสนุก</p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">เริ่มเล่นได้ทันที</h3>
                                <p className="mt-2 text-sm text-muted-foreground">ไม่ต้องสมัครสมาชิก ไม่ต้องดาวน์โหลด เปิดเว็บแล้วเล่นได้เลย</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                    <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold">เล่นกับเพื่อน</h3>
                                <p className="mt-2 text-sm text-muted-foreground">สร้างห้องและแชร์รหัสให้เพื่อน เข้าร่วมได้ทันที</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                                    <Globe className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="text-lg font-semibold">P2P Connection</h3>
                                <p className="mt-2 text-sm text-muted-foreground">เชื่อมต่อโดยตรงกับผู้เล่นอื่น ไม่ผ่านเซิร์ฟเวอร์กลาง</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                                    <Shield className="h-6 w-6 text-orange-500" />
                                </div>
                                <h3 className="text-lg font-semibold">ข้อมูลในเครื่อง</h3>
                                <p className="mt-2 text-sm text-muted-foreground">ข้อมูลทั้งหมดเก็บในเครื่องของคุณ ปลอดภัยและเป็นส่วนตัว</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
