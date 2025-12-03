"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Gamepad2, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
    const pathname = usePathname()

    // Hide navbar on game page
    if (pathname?.startsWith("/game/")) return null

    const navItems = [
        { href: "/", label: "หน้าแรก" },
        { href: "/how-to-play", label: "วิธีเล่น" },
        { href: "/profile", label: "โปรไฟล์" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Gamepad2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">Pok9</span>
                </Link>

                {/* Desktop Navigation */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        {navItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NavigationMenuLink
                                    asChild
                                    className={cn(
                                        navigationMenuTriggerStyle(),
                                        pathname === item.href && "text-primary"
                                    )}
                                >
                                    <Link href={item.href}>
                                        {item.label}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex items-center gap-2">
                    <Button asChild className="hidden md:inline-flex">
                        <Link href="/lobby">
                            <Gamepad2 className="mr-2 h-4 w-4" />
                            เล่นเลย
                        </Link>
                    </Button>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right" className="w-72">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "text-lg font-medium transition-colors hover:text-primary",
                                            pathname === item.href ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                ))}

                                <Button asChild className="mt-4">
                                    <Link href="/lobby">
                                        <Gamepad2 className="mr-2 h-4 w-4" />
                                        เล่นเลย
                                    </Link>
                                </Button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
