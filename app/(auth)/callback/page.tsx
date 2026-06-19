"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { parseCallback } from "@/lib/sso"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export default function SSOCallbackPage() {
    const router = useRouter()
    const { login, logout } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)
    const processed = useRef(false)

    useEffect(() => {
        if (processed.current) return
        processed.current = true

        queryClient.clear()
        logout()

        const handleSSO = async () => {
            try {
                const { code, codeVerifier } = parseCallback()

                const response = await api.post("/auth/sso/callback", {
                    code,
                    codeVerifier,
                })

                const { user, accessToken, refreshToken } = response.data.data

                login(user, accessToken, refreshToken)

                toast({
                    title: "Success",
                    description: "Logged in successfully via SSO",
                })

                router.push("/dashboard")
            } catch (err: any) {
                const message =
                    err.response?.data?.error?.message ||
                    err.message ||
                    "SSO login failed"
                setError(message)
                toast({
                    variant: "destructive",
                    title: "SSO Login Failed",
                    description: message,
                })
            }
        }

        handleSSO()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Login Failed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <a
                        href="/login"
                        className="inline-block text-sm text-primary underline hover:no-underline"
                    >
                        Back to login
                    </a>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                    Authenticating via SSO...
                </p>
            </CardContent>
        </Card>
    )
}
