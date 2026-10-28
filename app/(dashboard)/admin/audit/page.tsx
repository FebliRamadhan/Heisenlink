"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { formatDateTime } from "@/lib/utils"

export default function AuditPage() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["admin", "audit"],
        queryFn: async () => {
            const res = await api.get("/admin/audit-logs", { params: { limit: 100 } })
            return res.data.data
        }
    })

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
            {isLoading ? <div>Loading...</div> : <AuditTable logs={logs || []} />}
        </div>
    )
}

function AuditTable({ logs }: { logs: any[] }) {
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            <TableCell>{log.user?.username || 'System'}</TableCell>
                            <TableCell className="font-mono text-xs">{log.action}</TableCell>
                            <TableCell>
                                {log.entityType} {log.entityId && <span className="text-xs text-muted-foreground">({log.entityId.slice(0, 8)}...)</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                            <TableCell>
                                <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={JSON.stringify(log.newValues || log.oldValues)}>
                                    {log.newValues ? JSON.stringify(log.newValues) : '-'}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!logs.length && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No audit logs found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
