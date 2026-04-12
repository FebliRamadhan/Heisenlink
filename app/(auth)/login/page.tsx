"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api"
import { redirectToSSO, type SsoConfig } from "@/lib/sso"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, LogIn, ChevronDown, ChevronUp } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const { login, logout } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isSsoLoading, setIsSsoLoading] = useState(false)
    const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null)
    const [showLocalLogin, setShowLocalLogin] = useState(false)
    const queryClient = useQueryClient()

    // Clear all stale data when login page loads (covers all logout paths)
    useEffect(() => {
        queryClient.clear()
        logout()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch SSO config
    useEffect(() => {
        const fetchSsoConfig = async () => {
            try {
                const response = await api.get("/auth/sso/config")
                setSsoConfig(response.data.data)
            } catch {
                // SSO not available, show local login by default
                setShowLocalLogin(true)
            }
        }
        fetchSsoConfig()
    }, [])

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const handleSsoLogin = async () => {
        if (!ssoConfig) return
        setIsSsoLoading(true)
        try {
            await redirectToSSO(ssoConfig)
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to initiate SSO login",
            })
            setIsSsoLoading(false)
        }
    }

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true)
        try {
            const response = await api.post("/auth/login", data)
            const { user, accessToken, refreshToken } = response.data.data

            login(user, accessToken, refreshToken)

            toast({
                title: "Success",
                description: "Logged in successfully",
            })

            router.push("/dashboard")
        } catch (error: any) {
            const errorData = error.response?.data?.error

            if (errorData?.code === 'VALIDATION_ERROR' && errorData.details) {
                errorData.details.forEach((err: any) => {
                    setError(err.field as keyof LoginFormValues, {
                        type: "server",
                        message: err.message,
                    })
                })

                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please check the highlighted fields.",
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: errorData?.message || "Failed to login",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign in to your account</CardTitle>
                <CardDescription>
                    {ssoConfig?.enabled
                        ? "Use your organization account to sign in"
                        : "Enter your username and password to access the dashboard"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* SSO Login Button (Primary) */}
                {ssoConfig?.enabled && (
                    <>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSsoLogin}
                            disabled={isSsoLoading}
                        >
                            {isSsoLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="mr-2 h-4 w-4" />
                            )}
                            Sign in with SSO
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <button
                                    type="button"
                                    className="bg-card px-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                    onClick={() => setShowLocalLogin(!showLocalLogin)}
                                >
                                    {showLocalLogin ? (
                                        <>Hide local login <ChevronUp className="h-3 w-3" /></>
                                    ) : (
                                        <>Or use local account <ChevronDown className="h-3 w-3" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Local Login Form */}
                {(showLocalLogin || !ssoConfig?.enabled) && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="johndoe"
                                {...register("username")}
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <p className="text-sm text-red-500">{errors.username.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading} variant={ssoConfig?.enabled ? "outline" : "default"}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
