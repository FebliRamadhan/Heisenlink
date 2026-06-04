"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import type { Form } from "@/types"

interface ResponseRow {
    id: string
    submittedAt: string
    respondentEmail?: string | null
    answers: { questionId: string; text: string; fileUrl?: string | null; fileName?: string | null }[]
}

interface PaginationMeta {
    page: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    total: number
}

export function ResponsesTable({
    form,
    responses,
    pagination,
    onPageChange,
}: {
    form: Form
    responses: ResponseRow[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
}) {
    // Answerable columns in position order.
    const columns = (form.questions || []).filter((q) => q.type !== "SECTION" && q.type !== "STATEMENT")

    const cellFor = (row: ResponseRow, questionId: string) => {
        const matches = row.answers.filter((a) => a.questionId === questionId)
        if (!matches.length) return <span className="text-muted-foreground">—</span>
        return matches
            .map((a) =>
                a.fileUrl ? (
                    <a key={a.fileUrl} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {a.fileName || "file"}
                    </a>
                ) : (
                    <span key={a.questionId + a.text}>{a.text}</span>
                )
            )
            .reduce((acc: React.ReactNode[], el, i) => (i === 0 ? [el] : [...acc, ", ", el]), [])
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Submitted</TableHead>
                            {form.collectEmail && <TableHead>Email</TableHead>}
                            {columns.map((q) => (
                                <TableHead key={q.id} className="whitespace-nowrap">{q.title || "Untitled"}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {responses.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(row.submittedAt)}</TableCell>
                                {form.collectEmail && <TableCell>{row.respondentEmail || "—"}</TableCell>}
                                {columns.map((q) => (
                                    <TableCell key={q.id} className="max-w-[240px] truncate">{cellFor(row, q.id)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {!responses.length && (
                            <TableRow>
                                <TableCell colSpan={columns.length + (form.collectEmail ? 2 : 1)} className="h-24 text-center text-muted-foreground">
                                    No responses yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => onPageChange?.(pagination.page - 1)} disabled={!pagination.hasPrev}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange?.(pagination.page + 1)} disabled={!pagination.hasNext}>Next</Button>
                </div>
            )}
        </div>
    )
}
