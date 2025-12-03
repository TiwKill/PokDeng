import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Gamepad2 } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-card/30">
            <div className="py-8 md:py-12 px-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Gamepad2 className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold">Pok9</span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground">เกมไพ่ป็อกเด้งออนไลน์ เล่นกับเพื่อนได้ทันที ไม่ต้องลงทะเบียน</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">ลิงก์ด่วน</h3>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/how-to-play" className="hover:text-primary transition-colors">
                                    วิธีเล่น
                                </Link>
                            </li>
                            <li>
                                <Link href="/lobby" className="hover:text-primary transition-colors">
                                    เล่นเกม
                                </Link>
                            </li>
                            <li>
                                <Link href="/profile" className="hover:text-primary transition-colors">
                                    โปรไฟล์
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">เกี่ยวกับ</h3>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Pok9 เป็นเกมไพ่ที่เล่นกัน 2-6 คน โดยใช้ระบบ P2P ข้อมูลทั้งหมดเก็บในเครื่องของคุณ
                        </p>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2025 Pok9. All rights reserved.</p>
                    <p className="text-sm text-muted-foreground">Made with ❤️ in Thailand</p>
                </div>
            </div>
        </footer>
    )
}
