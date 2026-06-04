import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function FormsTableSkeleton() {
    return (
        <div className="rounded-md border">
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
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex flex-col space-y-1">
                                    <Skeleton className="h-4 w-[140px]" />
                                    <Skeleton className="h-3 w-[180px]" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-[70px] rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
