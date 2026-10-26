"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { AdminFormsTable } from "@/components/admin/forms-table"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function AdminFormsPage() {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)

    const { data: formsData, isLoading } = useQuery({
        queryKey: ["admin", "forms", page, limit, debouncedSearch],
        queryFn: async () => {
            const res = await api.get("/admin/forms", {
                params: {
                    page,
                    limit,
                    search: debouncedSearch,
                },
            })
            return res.data
        },
        placeholderData: (previousData) => previousData,
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Forms</h2>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search forms..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-[400px] bg-muted animate-pulse rounded" />
                </div>
            ) : (
                <AdminFormsTable
                    forms={formsData?.data || []}
                    pagination={formsData?.meta}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            )}
        </div>
    )
}
