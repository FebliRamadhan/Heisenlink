"use client"

import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

interface AdminForm {
    id: string
    title: string
    slug: string
    isPublished: boolean
    acceptingResponses: boolean
    closesAt: string | null
    responseCount: number
    questionCount: number
    createdAt: string
    updatedAt: string
    user: {
        username: string
        displayName: string
    }
}

// Same labels/colors as the user's own forms table (components/forms/forms-table.tsx)
function statusOf(form: AdminForm): { label: string; className: string } {
    if (!form.isPublished) return { label: "Draft", className: "bg-muted text-muted-foreground" }
    if (!form.acceptingResponses || (form.closesAt && new Date(form.closesAt).getTime() < Date.now())) {
        return { label: "Closed", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" }
    }
    return { label: "Published", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" }
}

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface AdminFormsTableProps {
    forms: AdminForm[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function AdminFormsTable({
    forms,
    pagination,
    onPageChange
}: AdminFormsTableProps) {
    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Updated At</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Form</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Questions</TableHead>
                            <TableHead>Responses</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.map((form) => (
                            <TableRow key={form.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(form.updatedAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{form.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{form.user.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <Link href={`/dashboard/forms/${form.id}`} className="font-medium truncate max-w-[220px] hover:underline" title={form.title}>
                                            {form.title || "Untitled form"}
                                        </Link>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-mono text-xs text-muted-foreground">/f/{form.slug}</span>
                                            <a href={`/f/${form.slug}`} target="_blank" rel="noreferrer">
                                                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </a>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusOf(form).className}`}>
                                        {statusOf(form).label}
                                    </span>
                                </TableCell>
                                <TableCell>{form.questionCount}</TableCell>
                                <TableCell>{form.responseCount}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <Link href={`/dashboard/forms/${form.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                    <Link href={`/dashboard/forms/${form.id}/responses`}>
                                        <Button variant="ghost" size="sm">Responses</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!forms.length && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No forms found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing {pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
