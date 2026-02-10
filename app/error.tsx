"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Unhandled error:", error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="relative mb-8">
                <div className="text-[120px] font-bold text-muted-foreground/10 leading-none select-none">
                    500
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Something Went Wrong
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
                An unexpected error occurred. Our team has been notified.
            </p>

            <div className="mt-8">
                <Button onClick={reset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>

            <div className="mt-12 text-sm text-muted-foreground">
                Heisenlink 🧪
            </div>
        </div>
    )
}
