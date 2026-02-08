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
import { Trash2, ExternalLink } from "lucide-react"
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

interface AdminLink {
    id: string
    code: string
    destinationUrl: string
    clickCount: number
    isActive: boolean
    createdAt: string
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

interface AdminLinksTableProps {
    links: AdminLink[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function AdminLinksTable({
    links,
    pagination,
    onPageChange
}: AdminLinksTableProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/admin/links/${id}`)
            toast({
                title: "Success",
                description: "Link deleted successfully",
            })
            queryClient.invalidateQueries({ queryKey: ["admin", "links"] })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete link",
            })
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Created At</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Short Link</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.map((link) => (
                            <TableRow key={link.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(link.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{link.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{link.user.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono font-medium">{link.code}</span>
                                        <a href={`/${link.code}`} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </a>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                    {link.destinationUrl}
                                </TableCell>
                                <TableCell>{link.clickCount}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the shortlink
                                                    and all associated click data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(link.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!links.length && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No links found.
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
