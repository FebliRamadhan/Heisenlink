"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { LinksTable } from "@/components/links/links-table"
import { LinksTableSkeleton } from "@/components/links/links-table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { BulkImportDialog } from "@/components/links/bulk-import-dialog"

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

    const handleExport = async (format: "csv" | "json") => {
        try {
            const res = await api.get("/links/export", {
                params: { format },
                responseType: "blob",
            })
            const blob = new Blob([res.data], {
                type: format === "csv" ? "text/csv" : "application/json",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `my-links-export.${format}`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Export failed:", error)
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Short links you own, with their destinations and clicks.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/links/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Link
                    </Link>
                </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder="Filter links…"
                        aria-label="Filter links"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            setPage(1) // Reset to first page on search
                        }}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("csv")}>
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("json")}>
                                Export as JSON
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <BulkImportDialog />
                </div>
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

