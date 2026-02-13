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
        <header className="border-b bg-background/95 backdrop-blur z-50 sticky top-0">
            <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
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
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl">LinkHub</span>
                    </Link>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <UserNav />
                </div>
            </div>
        </header>
    )
}
