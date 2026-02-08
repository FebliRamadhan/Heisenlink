"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { LinksTable } from "@/components/links/links-table"
import { LinksTableSkeleton } from "@/components/links/links-table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"

export default function LinksPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const debouncedSearch = useDebounce(search, 500)

    const { data, isLoading } = useQuery({
        queryKey: ["links", debouncedSearch, page, limit],
        queryFn: async () => {
            const res = await api.get("/links", {
                params: { search: debouncedSearch, page, limit }
            })
            // Return entire response data object which includes { data: links, meta: pagination }
            return res.data
        },
        // Reset page when search changes
        placeholderData: (previousData: any) => previousData,
    })

    // Reset pagination when search changes
    if (search !== debouncedSearch) {
        // This effect runs during render if search changed but debounce hasn't
        // We might want useLayoutEffect or just wait for debounce
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Links</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/links/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Link
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter links..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1) // Reset to first page on search
                    }}
                    className="max-w-sm"
                />
            </div>
            {isLoading ? (
                <LinksTableSkeleton />
            ) : (
                <LinksTable
                    links={data?.data || []}
                    pagination={data?.meta}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            )}
        </div>
    )
}
