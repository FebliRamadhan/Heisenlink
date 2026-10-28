"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { useState } from "react"

export default function SettingsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Passwords do not match" })
            return
        }

        try {
            await api.patch("/auth/password", { password })
            toast({ title: "Password updated successfully" })
            setPassword("")
            setConfirmPassword("")
        } catch (e) {
            toast({ variant: "destructive", title: "Failed to update password" })
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your account and password.</p>
            </div>

            <div className="grid max-w-2xl gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <dl className="divide-y border-t text-sm">
                            <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
                                <dt className="text-muted-foreground">Username</dt>
                                <dd className="font-mono">{user?.username}</dd>
                            </div>
                            <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
                                <dt className="text-muted-foreground">Email</dt>
                                <dd className="truncate">{user?.email}</dd>
                            </div>
                            <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
                                <dt className="text-muted-foreground">Role</dt>
                                <dd>{user?.role === "ADMIN" ? "Admin" : "User"}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    autoComplete="new-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    autoComplete="new-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={!password}>Update Password</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
