"use client"

import { UserNav } from "./user-nav"
import Link from "next/link"

export default function Header() {
    return (
        <header className="border-b bg-background/95 backdrop-blur z-50 sticky top-0">
            <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
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
