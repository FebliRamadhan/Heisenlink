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
            <div className="overflow-x-auto rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="min-w-[260px]">Short link</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[56px]"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.map((link) => (
                            <TableRow key={link.id} className={link.isActive ? undefined : "text-muted-foreground"}>
                                <TableCell className="py-3">
                                    <Link
                                        href={`/dashboard/links/${link.id}`}
                                        className="block truncate font-medium text-foreground hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                    >
                                        {link.title || link.code}
                                    </Link>
                                    <div className="mt-1 flex items-center gap-1">
                                        <span className="truncate font-mono text-[13px] text-muted-foreground">/{link.code}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground"
                                            onClick={() => copyToClipboard(link.shortUrl)}
                                            aria-label={`Copy ${link.shortUrl}`}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[320px]">
                                    <a
                                        href={link.destinationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={link.destinationUrl}
                                        className="inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                    >
                                        <span className="truncate">{link.destinationUrl.replace(/^https?:\/\//, "")}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    </a>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{link.clickCount.toLocaleString("id-ID")}</TableCell>
                                <TableCell>
                                    <label className="inline-flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={link.isActive}
                                            onCheckedChange={() => toggleStatus(link.id, link.isActive)}
                                            aria-label={`${link.isActive ? "Deactivate" : "Activate"} ${link.title || link.code}`}
                                        />
                                        <span className="w-14">{link.isActive ? "Active" : "Off"}</span>
                                    </label>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(link.createdAt)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Link actions">
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
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(link.id)}>
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!links.length && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={6} className="py-16 text-center">
                                    <LinkIcon className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                                    <p className="mt-3 font-medium">No links found</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Create a new link to get started</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground tabular-nums">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </p>
                    <div className="flex gap-2">
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
