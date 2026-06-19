"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Forms</h2>
                <Button onClick={createForm} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "Create Form"}
                </Button>
            </div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter forms..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="max-w-sm"
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
