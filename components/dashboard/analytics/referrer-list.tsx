"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe } from "lucide-react"

interface ReferrerListProps {
    data: { referrer: string; count: number }[]
}

export function ReferrerList({ data }: ReferrerListProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Top Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {(!data || data.length === 0) && (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            No data available
                        </div>
                    )}

                    {data?.map((item, index) => (
                        <div key={index} className="flex items-center">
                            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-1 overflow-hidden flex-1">
                                <p className="text-sm font-medium leading-none truncate" title={item.referrer}>
                                    {item.referrer || 'Direct / Unknown'}
                                </p>
                            </div>
                            <div className="ml-auto font-medium">{item.count.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
