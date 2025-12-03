"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, X } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
    messages: ChatMessage[]
    currentUserId: string
    onSend: (message: string) => void
    isOpen: boolean
    onClose: () => void
}

export function ChatPanel({ messages, currentUserId, onSend, isOpen, onClose }: ChatPanelProps) {
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = () => {
        if (input.trim()) {
            onSend(input.trim())
            setInput("")
        }
    }

    if (!isOpen) return null

    return (
        <Card className="fixed right-4 bottom-4 w-80 h-96 shadow-2xl flex flex-col z-50">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <CardTitle className="text-sm font-medium">แชทในห้อง</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-3" ref={scrollRef}>
                    <div className="space-y-3">
                        {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีข้อความ</p>}
                        {messages.map((msg) => {
                            const isMe = msg.playerId === currentUserId
                            return (
                                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    <span className={cn("text-xs mb-1", isMe ? "text-primary" : "text-muted-foreground")}>
                                        {msg.playerName}
                                        <span className="ml-2 text-muted-foreground/50">
                                            {new Date(msg.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </span>
                                    <div
                                        className={cn(
                                            "px-3 py-2 rounded-lg max-w-[85%] text-sm",
                                            isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                                        )}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-3 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-1"
                    />
                    <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
