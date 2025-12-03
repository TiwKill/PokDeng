import type React from "react"
import type { Metadata } from "next"
import { Prompt } from "next/font/google"
import "./globals.css"

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
    title: "ป็อกเด้ง | เกมไพ่ออนไลน์",
    description: "เล่นเกมไพ่ป็อกเด้งออนไลน์กับเพื่อน แบบ P2P ไม่ต้องลงทะเบียน",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${prompt.className} antialiased`}>
                {children}
            </body>
        </html>
    );
}
