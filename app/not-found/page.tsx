import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Link Not Found
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Sorry, the link you are looking for does not exist or has been removed.
            </p>
            <div className="mt-8 flex gap-4">
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
