"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/components/ui/use-toast"
import { FormsTable } from "@/components/forms/forms-table"
import { FormsTableSkeleton } from "@/components/forms/forms-table-skeleton"

export default function FormsPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const debouncedSearch = useDebounce(search, 500)
    const router = useRouter()
    const { toast } = useToast()
    const [creating, setCreating] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ["forms", debouncedSearch, page],
        queryFn: async () => {
            const res = await api.get("/forms", { params: { search: debouncedSearch, page, limit: 10 } })
            return res.data
        },
        placeholderData: (previousData: any) => previousData,
    })

    const createForm = async () => {
        setCreating(true)
        try {
            const res = await api.post("/forms", {})
            router.push(`/dashboard/forms/${res.data.data.id}`)
        } catch {
            toast({ variant: "destructive", title: "Failed to create form" })
            setCreating(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Forms you own or that are shared with you.</p>
                </div>
                <Button onClick={createForm} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "Create Form"}
                </Button>
            </div>
            <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                    placeholder="Filter forms…"
                    aria-label="Filter forms"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="pl-9"
                />
            </div>
            {isLoading ? (
                <FormsTableSkeleton />
            ) : (
                <FormsTable forms={data?.data || []} pagination={data?.meta} onPageChange={setPage} />
            )}
        </div>
    )
}
