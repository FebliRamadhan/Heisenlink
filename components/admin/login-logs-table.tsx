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

interface AuditLog {
    id: string
    user: {
        username: string
        displayName?: string
    } | null
    action: string
    entityType: string
    entityId: string | null
    oldValues: any
    newValues: any
    ipAddress: string | null
    createdAt: string
}

interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface LoginLogsTableProps {
    logs: AuditLog[]
    pagination?: PaginationMeta
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
}

export function LoginLogsTable({
    logs,
    pagination,
    onPageChange
}: LoginLogsTableProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{formatDate(log.createdAt)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-medium">{log.user?.username || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{log.user?.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                        {log.action}
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                                <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                    {/* Display user agent if available in newValues */}
                                    {log.newValues?.userAgent?.userAgent || log.newValues?.userAgent || JSON.stringify(log.newValues || {})}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!logs.length && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No logs found.
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
