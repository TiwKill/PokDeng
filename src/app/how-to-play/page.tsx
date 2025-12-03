import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen, Layers, Sparkles, ListOrdered } from "lucide-react"

export default function HowToPlayPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="text-center mb-8">
                        <Badge variant="outline" className="mb-4">
                            <BookOpen className="mr-2 h-3 w-3" />
                            คู่มือการเล่น
                        </Badge>
                        <h1 className="text-3xl font-bold">วิธีเล่น Pok9</h1>
                        <p className="text-muted-foreground mt-2">เรียนรู้กฎและวิธีเล่นเกมไพ่ป็อกเด้ง</p>
                    </div>

                    {/* Basic Rules */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" />
                                <CardTitle>กฎพื้นฐาน</CardTitle>
                            </div>
                            <CardDescription>ทำความเข้าใจพื้นฐานของเกม</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>Pok9 (ป็อกเด้ง) เป็นเกมไพ่ที่เล่นกัน 2-6 คน โดยใช้ไพ่ 52 ใบ</p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>ผู้เล่นแต่ละคนจะได้รับไพ่ 2 ใบ</li>
                                <li>สามารถจั่วไพ่เพิ่มได้อีก 1 ใบ (รวมสูงสุด 3 ใบ)</li>
                                <li>นับแต้มจากหลักหน่วยของผลรวม (เช่น 15 = 5 แต้ม)</li>
                                <li>ผู้ที่มีแต้มสูงกว่าชนะ</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Card Values */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>ค่าของไพ่</CardTitle>
                            <CardDescription>แต่ละใบมีค่าแตกต่างกัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-secondary/50 border-0">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold mb-1">A</div>
                                        <div className="text-sm text-muted-foreground">= 1 แต้ม</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-secondary/50 border-0">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold mb-1">2-9</div>
                                        <div className="text-sm text-muted-foreground">= ตามหน้าไพ่</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-secondary/50 border-0">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-lg font-bold mb-1">10, J, Q, K</div>
                                        <div className="text-sm text-muted-foreground">= 0 แต้ม</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-primary/10 border-primary/20">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-lg font-bold mb-1 text-primary">ตัวอย่าง</div>
                                        <div className="text-sm text-muted-foreground">9+K = 9 แต้ม</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Special Hands */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <CardTitle>มือพิเศษ</CardTitle>
                            </div>
                            <CardDescription>มือพิเศษจะได้รับตัวคูณเพิ่ม</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="pok9">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">x2</Badge>
                                            <span className="font-semibold text-yellow-500">ป็อก 9</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">ได้ 9 แต้มจาก 2 ใบแรก เช่น 4+5, 9+K, 9+10</p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="pok8">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-orange-500 text-orange-950 hover:bg-orange-500">x2</Badge>
                                            <span className="font-semibold text-orange-500">ป็อก 8</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">ได้ 8 แต้มจาก 2 ใบแรก เช่น 3+5, 8+K, 8+10</p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="tong">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-purple-500 text-white hover:bg-purple-500">x5</Badge>
                                            <span className="font-semibold text-purple-500">ตอง</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">3 ใบหน้าเหมือนกัน เช่น KKK, 777, AAA</p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="straight">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-blue-500 text-white hover:bg-blue-500">x3</Badge>
                                            <span className="font-semibold text-blue-500">เรียง</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">3 ใบติดกัน เช่น 456, 789, JQK</p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="samecolor">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-green-500 text-white hover:bg-green-500">x3</Badge>
                                            <span className="font-semibold text-green-500">สามสี</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">3 ใบดอกเดียวกัน เช่น โพดำทั้งหมด, หัวใจทั้งหมด</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* How to Play Steps */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ListOrdered className="h-5 w-5 text-primary" />
                                <CardTitle>ขั้นตอนการเล่น</CardTitle>
                            </div>
                            <CardDescription>ทำตามขั้นตอนเหล่านี้เพื่อเริ่มเล่น</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-4">
                                {[
                                    { step: 1, text: "สร้างห้องหรือเข้าร่วมห้องของเพื่อน" },
                                    { step: 2, text: "รอผู้เล่นครบและกดพร้อม" },
                                    { step: 3, text: "เจ้ามือแจกไพ่คนละ 2 ใบ" },
                                    { step: 4, text: "ดูไพ่ในมือและตัดสินใจว่าจะจั่วเพิ่มหรือไม่" },
                                    { step: 5, text: "ถ้าได้ ป็อก 8 หรือ ป็อก 9 จะไม่สามารถจั่วเพิ่มได้" },
                                    { step: 6, text: "เมื่อทุกคนพร้อม เปิดไพ่เทียบกับเจ้ามือ" },
                                    { step: 7, text: "ผู้ที่มีแต้มสูงกว่าเจ้ามือชนะ" },
                                ].map((item) => (
                                    <li key={item.step} className="flex items-start gap-4">
                                        <Badge
                                            variant="outline"
                                            className="h-8 w-8 rounded-full p-0 flex items-center justify-center shrink-0"
                                        >
                                            {item.step}
                                        </Badge>
                                        <span className="text-muted-foreground pt-1">{item.text}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    )
}
