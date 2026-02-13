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
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Trash, ExternalLink } from "lucide-react"

export default function AdminLinksPage() {
    const { data: links, isLoading } = useQuery({
        queryKey: ["admin", "links"],
        queryFn: async () => {
            const res = await api.get("/admin/links", { params: { limit: 100 } })
            return res.data.data
        }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">System Links</h2>
            {isLoading ? <div>Loading...</div> : <AdminLinksTable links={links || []} />}
        </div>
    )
}

function AdminLinksTable({ links }: { links: any[] }) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this link permanently?")) return
        try {
            await api.delete(`/admin/links/${id}`)
            queryClient.invalidateQueries({ queryKey: ["admin", "links"] })
            toast({ title: "Link deleted" })
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to delete link" })
        }
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.map(link => (
                        <TableRow key={link.id}>
                            <TableCell className="font-medium">{link.code}</TableCell>
                            <TableCell>
                                <div className="max-w-[300px] truncate" title={link.destinationUrl}>
                                    {link.destinationUrl}
                                </div>
                            </TableCell>
                            <TableCell>
                                {link.user ? (
                                    <div className="flex flex-col">
                                        <span>{link.user.username}</span>
                                        <span className="text-xs text-muted-foreground">{link.user.displayName}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Unknown</span>
                                )}
                            </TableCell>
                            <TableCell>{link.clickCount}</TableCell>
                            <TableCell>{formatDate(link.createdAt)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(link.id)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!links.length && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No links found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
