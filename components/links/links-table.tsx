"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShortLink } from "@/types"
import { MoreHorizontal, ExternalLink, QrCode, Copy, Edit, Trash, Link as LinkIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { QRCodeModal } from "./qr-code-modal"

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface LinksTableProps {
    links: ShortLink[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function LinksTable({
    links,
    pagination,
    onPageChange,
    onLimitChange
}: LinksTableProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [selectedQrLink, setSelectedQrLink] = useState<ShortLink | null>(null)

    const openQrModal = (link: ShortLink) => {
        setSelectedQrLink(link)
        setQrModalOpen(true)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({
            description: "Copied to clipboard",
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this link?")) return
        try {
            await api.delete(`/links/${id}`)
            queryClient.invalidateQueries({ queryKey: ["links"] })
            toast({
                title: "Link deleted",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error deleting link",
            })
        }
    }

    const toggleStatus = async (id: string, isActive: boolean) => {
        try {
            await api.patch(`/links/${id}`, { isActive: !isActive })
            queryClient.invalidateQueries({ queryKey: ["links"] })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error updating status",
            })
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Link</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.map((link) => (
                            <TableRow key={link.id}>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{link.title || link.code}</span>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <span className="truncate max-w-[200px]">{link.shortUrl}</span>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => copyToClipboard(link.shortUrl)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center max-w-[300px] truncate text-muted-foreground" title={link.destinationUrl}>
                                        <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                                            {link.destinationUrl}
                                            <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                    </div>
                                </TableCell>
                                <TableCell>{link.clickCount}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={link.isActive}
                                        onCheckedChange={() => toggleStatus(link.id, link.isActive)}
                                    />
                                </TableCell>
                                <TableCell>{formatDate(link.createdAt)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => copyToClipboard(link.shortUrl)}>
                                                <Copy className="mr-2 h-4 w-4" /> Copy
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/links/${link.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openQrModal(link)}>
                                                <QrCode className="mr-2 h-4 w-4" /> QR Code
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(link.id)}>
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!links.length && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                        <div className="rounded-full bg-muted p-3">
                                            <LinkIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-medium">No links found</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Create a new link to get started
                                            </p>
                                        </div>
                                    </div>
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

            {/* QR Code Modal */}
            {selectedQrLink && (
                <QRCodeModal
                    open={qrModalOpen}
                    onClose={() => {
                        setQrModalOpen(false)
                        setSelectedQrLink(null)
                    }}
                    linkId={selectedQrLink.id}
                    linkCode={selectedQrLink.code}
                    shortUrl={selectedQrLink.shortUrl}
                />
            )}
        </div>
    )
}
