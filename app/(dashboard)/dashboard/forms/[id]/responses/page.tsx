"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ResponsesSummary } from "@/components/forms/responses-summary"
import { ResponsesTable } from "@/components/forms/responses-table"
import type { Form } from "@/types"

export default function ResponsesPage({ params }: { params: { id: string } }) {
    const { id } = params
    const { toast } = useToast()
    const [page, setPage] = useState(1)

    const { data: form } = useQuery<Form>({
        queryKey: ["form", id],
        queryFn: async () => (await api.get(`/forms/${id}`)).data.data,
    })

    const summary = useQuery({
        queryKey: ["form-summary", id],
        queryFn: async () => (await api.get(`/forms/${id}/summary`)).data.data,
    })

    const responses = useQuery({
        queryKey: ["form-responses", id, page],
        queryFn: async () => (await api.get(`/forms/${id}/responses`, { params: { page, limit: 20 } })).data,
        placeholderData: (prev: any) => prev,
    })

    const exportResponses = async (format: "csv" | "xlsx") => {
        try {
            const res = await api.get(`/forms/${id}/responses/export`, {
                params: { format },
                responseType: "blob",
            })
            const mime =
                format === "xlsx"
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv"
            const url = URL.createObjectURL(new Blob([res.data], { type: mime }))
            const a = document.createElement("a")
            a.href = url
            a.download = `${form?.slug || "form"}-responses.${format}`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast({ variant: "destructive", title: "Export failed" })
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/forms/${id}`} aria-label="Back to editor">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{form?.title || "Responses"}</h2>
                        <p className="text-sm text-muted-foreground">{summary.data?.responseCount ?? form?.responseCount ?? 0} response(s)</p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportResponses("xlsx")}>Export as Excel (.xlsx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportResponses("csv")}>Export as CSV</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="summary">
                <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="individual">Individual</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-6">
                    {summary.isLoading ? <Skeleton className="h-64 w-full" /> : summary.data && <ResponsesSummary data={summary.data} />}
                </TabsContent>

                <TabsContent value="individual" className="mt-6">
                    {responses.isLoading || !form ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <ResponsesTable
                            form={form}
                            responses={responses.data?.data || []}
                            pagination={responses.data?.meta}
                            onPageChange={setPage}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
