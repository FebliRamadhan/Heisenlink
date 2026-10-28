"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export function AuthButton({ variant = "header", className }: { variant?: "header" | "cta"; className?: string }) {
    const { isAuthenticated, isLoading } = useAuth()

    const href = isAuthenticated ? "/dashboard" : "/login"

    if (variant === "cta") {
        return (
            <Link href={href} className={className}>
                {isLoading ? "Loading…" : isAuthenticated ? "Go to Dashboard" : "Login to Portal"}
            </Link>
        )
    }

    return (
        <Link href={href} className={className}>
            {isLoading ? "…" : isAuthenticated ? "Dashboard" : "Sign In"}
        </Link>
    )
}
