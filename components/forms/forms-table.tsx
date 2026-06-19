"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Copy, Trash, BarChart2, ExternalLink, ClipboardList } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import type { Form } from "@/types"

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface FormsTableProps {
    forms: Form[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
}

function statusOf(form: Form): { label: string; className: string } {
    if (!form.isPublished) return { label: "Draft", className: "bg-muted text-muted-foreground" }
    if (!form.acceptingResponses || (form.closesAt && new Date(form.closesAt).getTime() < Date.now())) {
        return { label: "Closed", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" }
    }
    return { label: "Published", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" }
}

export function FormsTable({ forms, pagination, onPageChange }: FormsTableProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [pendingDelete, setPendingDelete] = useState<Form | null>(null)

    const copyLink = (form: Form) => {
        navigator.clipboard.writeText(form.url)
        toast({ description: "Public link copied to clipboard" })
    }

    const duplicate = async (id: string) => {
        try {
            await api.post(`/forms/${id}/duplicate`)
            queryClient.invalidateQueries({ queryKey: ["forms"] })
            toast({ title: "Form duplicated" })
        } catch {
            toast({ variant: "destructive", title: "Failed to duplicate" })
        }
    }

    const confirmDelete = async () => {
        if (!pendingDelete) return
        try {
            await api.delete(`/forms/${pendingDelete.id}`)
            queryClient.invalidateQueries({ queryKey: ["forms"] })
            toast({ title: "Form deleted" })
        } catch {
            toast({ variant: "destructive", title: "Failed to delete" })
        } finally {
            setPendingDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Form</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Responses</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.map((form) => {
                            const status = statusOf(form)
                            const isOwner = form.isOwner ?? true
                            const canEdit = form.myRole !== "VIEWER"
                            return (
                                <TableRow key={form.id}>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/forms/${form.id}`} className="font-medium hover:underline">
                                                    {form.title}
                                                </Link>
                                                {!isOwner && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                                                        Shared · {canEdit ? "Editor" : "Viewer"}
                                                    </span>
                                                )}
                                            </div>
                                            <a
                                                href={form.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-xs text-muted-foreground hover:underline"
                                            >
                                                <span className="truncate max-w-[220px]">{form.url}</span>
                                                <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </TableCell>
                                    <TableCell>{form.responseCount}</TableCell>
                                    <TableCell>{formatDate(form.updatedAt)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Form actions">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/forms/${form.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" /> {canEdit ? "Edit" : "View"}
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/forms/${form.id}/responses`}>
                                                        <BarChart2 className="mr-2 h-4 w-4" /> Responses
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => copyLink(form)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Copy link
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => duplicate(form.id)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                </DropdownMenuItem>
                                                {isOwner && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => setPendingDelete(form)}>
                                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {!forms.length && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                        <div className="rounded-full bg-muted p-3">
                                            <ClipboardList className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-medium">No forms yet</h3>
                                            <p className="text-sm text-muted-foreground">Create a form to start collecting responses</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onPageChange?.(pagination.page - 1)} disabled={!pagination.hasPrev}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange?.(pagination.page + 1)} disabled={!pagination.hasNext}>
                        Next
                    </Button>
                </div>
            )}

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;{pendingDelete?.title}&rdquo; and all its responses will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
