"use client"

import { useState } from "react"
import { UserNav } from "./user-nav"
import { Sidebar } from "./sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 border-b bg-background">
            <div className="flex h-14 items-center px-4 sm:px-6">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden mr-2" aria-label="Open menu">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
                    </SheetContent>
                </Sheet>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <img src="/logo-panrb.png" alt="Logo Kementerian PANRB" className="h-8 w-auto" />
                    <span className="hidden sm:flex items-baseline gap-2">
                        <span className="font-semibold">Heisenlink</span>
                        <span className="text-sm text-muted-foreground">Kementerian PANRB</span>
                    </span>
                </Link>
                <div className="ml-auto flex items-center gap-4">
                    <UserNav />
                </div>
            </div>
        </header>
    )
}
