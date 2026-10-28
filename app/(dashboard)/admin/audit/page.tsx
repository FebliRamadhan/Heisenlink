"use client"

import { Skeleton } from "@/components/ui/skeleton"
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
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
                <p className="mt-1 text-sm text-muted-foreground">Who did what, and from where.</p>
            </div>
            {isLoading ? <Skeleton className="h-96 w-full rounded-lg" /> : <AuditTable logs={logs || []} />}
        </div>
    )
}

const sentence = (s?: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "")

// Details read as "key: value" pairs instead of raw JSON; the full object stays in the title.
function details(values: Record<string, unknown> | null | undefined) {
    if (!values) return null
    return Object.entries(values)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(", ")
}

function AuditTable({ logs }: { logs: any[] }) {
    return (
        <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => {
                        const values = log.newValues || log.oldValues
                        return (
                            <TableRow key={log.id} className="text-sm">
                                <TableCell className="whitespace-nowrap py-2 tabular-nums">{formatDateTime(log.createdAt)}</TableCell>
                                <TableCell className="py-2">{log.user?.username || 'System'}</TableCell>
                                <TableCell className="py-2 font-mono text-[13px]">{log.action}</TableCell>
                                <TableCell className="whitespace-nowrap py-2">
                                    {sentence(log.entityType)}
                                    {log.entityId && <span className="ml-2 font-mono text-xs text-muted-foreground" title={log.entityId}>{log.entityId.slice(0, 8)}</span>}
                                </TableCell>
                                <TableCell className="py-2 font-mono text-[13px] text-muted-foreground">{log.ipAddress}</TableCell>
                                <TableCell className="py-2">
                                    <div className="max-w-[280px] truncate text-muted-foreground" title={values ? JSON.stringify(values) : undefined}>
                                        {details(values) || '-'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    {!logs.length && (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                                No audit logs found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
