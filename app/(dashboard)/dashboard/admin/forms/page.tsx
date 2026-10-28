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
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Manage Forms</h1>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full md:w-[300px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder="Search forms…"
                        aria-label="Search forms"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-[400px] bg-muted animate-pulse motion-reduce:animate-none rounded" />
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
