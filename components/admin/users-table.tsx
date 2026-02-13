"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, User } from "lucide-react"
import { formatDate } from "@/lib/utils"
// We assume User type exists in types/index.ts, if not we define minimal here or import
// If types/index.ts doesn't have User, we uses any for now or define interface
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

interface User {
    id: string
    username: string
    email: string
    displayName?: string
    role: "ADMIN" | "USER"
    isActive: boolean
    lastLoginAt?: string
    createdAt: string
    linksCount?: number
}

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface UsersTableProps {
    users: User[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function UsersTable({
    users,
    pagination,
    onPageChange
}: UsersTableProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const toggleStatus = async (id: string, isActive: boolean) => {
        setIsLoading(id)
        try {
            await api.patch(`/admin/users/${id}`, { isActive: !isActive })
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
            toast({
                title: !isActive ? "User activated" : "User deactivated",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error updating status",
                description: error.response?.data?.message || "Something went wrong"
            })
        } finally {
            setIsLoading(null)
        }
    }

    const toggleRole = async (id: string, currentRole: string) => {
        if (!confirm(`Promote/Demote user? Current: ${currentRole}`)) return
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'

        setIsLoading(id)
        try {
            await api.patch(`/admin/users/${id}`, { role: newRole })
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
            toast({
                title: "User role updated",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error updating role",
                description: error.response?.data?.message || "Something went wrong"
            })
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Links</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{user.username}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.role === 'ADMIN' ? <Shield className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-slate-500" />}
                                        <span className="text-sm">{user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={user.isActive}
                                        onCheckedChange={() => toggleStatus(user.id, user.isActive)}
                                        disabled={isLoading === user.id}
                                    />
                                </TableCell>
                                <TableCell>{user.linksCount || 0}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatDate(user.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]" aria-label="User actions">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => toggleRole(user.id, user.role)}>
                                                {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!users.length && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
