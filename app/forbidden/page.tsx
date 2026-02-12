import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldX, ArrowLeft, Home } from "lucide-react"

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="relative mb-8">
                <div className="text-[120px] font-bold text-muted-foreground/10 leading-none select-none">
                    403
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldX className="h-10 w-10 text-destructive" />
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Access Denied
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
                You don&apos;t have permission to access this resource.
            </p>

            <div className="mt-8 flex gap-3">
                <Link href="/dashboard">
                    <Button>
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            <div className="mt-12 text-sm text-muted-foreground">
                Heisenlink 🧪
            </div>
        </div>
    )
}
