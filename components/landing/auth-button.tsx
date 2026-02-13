"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ArrowRight } from "lucide-react"

export function AuthButton({ variant = "header" }: { variant?: "header" | "cta" }) {
    const { isAuthenticated, isLoading } = useAuth()

    const href = isAuthenticated ? "/dashboard" : "/login"

    if (variant === "cta") {
        return (
            <Link href={href} className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-cyan-600">
                    {isLoading ? "Loading..." : isAuthenticated ? (
                        <>Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></>
                    ) : "Login to Portal"}
                </Button>
            </Link>
        )
    }

    return (
        <Link href={href}>
            <Button className="rounded-full px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-cyan-600 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
                {isLoading ? "..." : isAuthenticated ? "Dashboard" : "Sign In"}
            </Button>
        </Link>
    )
}
