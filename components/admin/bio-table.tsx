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
import { formatDate } from "@/lib/utils"
import { Trash2, ExternalLink, UserCircle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminBioPage {
    id: string
    title: string
    urlHandle: string
    avatarUrl: string
    createdAt: string
    linksCount: number
    user: {
        username: string
        displayName: string
    }
}

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface AdminBioTableProps {
    bios: AdminBioPage[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function AdminBioTable({
    bios,
    pagination,
    onPageChange
}: AdminBioTableProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Assuming we might want to delete bio pages
    // Currently backend doesn't have explicit DELETE /admin/bio/:id, but we can reuse DELETE /bio/:id if admin middleware allows?
    // Actually, plan didn't specify DELETE endpoint for bio for admin, but it's implied in "Manage".
    // Let's assume we might need to add it or use the user-facing one if appropriate (permissions).
    // The user-facing one likely checks ownership. Admin likely needs specific endpoint or override.
    // For now, I'll comment out the delete action implementation or assume it exists/will exist.
    // Wait, the plan only said "Manage Links" and "Manage Bios".
    // I will include a Delete button but maybe disable it or map to a hypothetical endpoint for now.
    // Actually, `deleteLink` handles ShortLink. `deleteBioPage` likely handles BioPage. 
    // I should check if there is an admin delete endpoint for Bio.
    // Looking at routes, only `deleteLink` was explicitly in admin routes.
    // I'll skip the delete button for now to avoid errors, or just show "View".

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Created At</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Bio Page</TableHead>
                            <TableHead>Handle</TableHead>
                            <TableHead>Links</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bios.map((bio) => (
                            <TableRow key={bio.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(bio.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{bio.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{bio.user.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={bio.avatarUrl} alt={bio.title} />
                                            <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium truncate max-w-[150px]" title={bio.title}>{bio.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-sm">@{bio.urlHandle}</span>
                                        <a href={`/bio/${bio.urlHandle}`} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </a>
                                    </div>
                                </TableCell>
                                <TableCell>{bio.linksCount}</TableCell>
                                <TableCell className="text-right">
                                    {/* Action buttons placeholder */}
                                    <a href={`/bio/${bio.urlHandle}`} target="_blank" rel="noreferrer">
                                        <Button variant="ghost" size="sm">View Public</Button>
                                    </a>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!bios.length && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No bio pages found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
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
