"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { UsersTable } from "@/components/admin/users-table"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function UsersPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const debouncedSearch = useDebounce(search, 500)

    const { data: userData, isLoading } = useQuery({
        queryKey: ["admin", "users", debouncedSearch, page, limit],
        queryFn: async () => {
            const res = await api.get("/admin/users", {
                params: {
                    search: debouncedSearch,
                    page,
                    limit
                }
            })
            return res.data
        },
        placeholderData: (previousData) => previousData,
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            </div>

            <div className="flex items-center py-4">
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                    }}
                    className="max-w-sm"
                />
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-10 w-[200px] bg-muted animate-pulse rounded" />
                    <div className="h-[400px] bg-muted animate-pulse rounded" />
                </div>
            ) : (
                <UsersTable
                    users={userData?.data || []}
                    pagination={userData?.meta}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            )}
        </div>
    )
}
