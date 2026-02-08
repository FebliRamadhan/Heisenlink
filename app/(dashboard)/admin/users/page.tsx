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
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function AdminUsersPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const res = await api.get("/admin/users", { params: { limit: 100 } })
            return res.data.data
        }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            {isLoading ? <div>Loading...</div> : <UsersTable users={users || []} />}
        </div>
    )
}

function UsersTable({ users }: { users: any[] }) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const toggleStatus = async (id: string, isActive: boolean) => {
        try {
            await api.patch(`/admin/users/${id}`, { isActive: !isActive })
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
            toast({ title: "User status updated" })
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update user" })
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Links</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Active</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.linksCount}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                                <Switch
                                    checked={user.isActive}
                                    onCheckedChange={() => toggleStatus(user.id, user.isActive)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
