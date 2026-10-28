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
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
            </div>

            <div className="flex items-center">
                <Input
                    placeholder="Search users…"
                        aria-label="Search users"
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
                    <div className="h-10 w-[200px] bg-muted animate-pulse motion-reduce:animate-none rounded" />
                    <div className="h-[400px] bg-muted animate-pulse motion-reduce:animate-none rounded" />
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
