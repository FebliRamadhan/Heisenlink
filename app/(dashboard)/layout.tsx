"use client"

import Header from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 h-[calc(100vh-3.5rem)] supports-[height:100dvh]:h-[calc(100dvh-3.5rem)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
