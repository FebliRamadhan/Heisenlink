import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"

export default function LinkInactivePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Ban className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Link Inactive
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                This link has been deactivated by the owner or has expired.
            </p>
            <div className="mt-8 flex gap-4">
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
