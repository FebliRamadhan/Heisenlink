"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Link as LinkIcon, UserCircle, BarChart2, Settings, Shield, Activity, ScrollText, ClipboardList } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface SidebarProps {
    mobile?: boolean
    onNavigate?: () => void
}

type NavItem = { href: string; title: string; icon: typeof LinkIcon }

const WORKSPACE: NavItem[] = [
    { href: "/dashboard", title: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/links", title: "My Links", icon: LinkIcon },
    { href: "/dashboard/bio", title: "Bio Page", icon: UserCircle },
    { href: "/dashboard/forms", title: "Forms", icon: ClipboardList },
    { href: "/dashboard/analytics", title: "Analytics", icon: BarChart2 },
]

const ADMIN: NavItem[] = [
    { href: "/admin", title: "Admin Console", icon: Activity },
    { href: "/dashboard/admin/links", title: "Manage Links", icon: LinkIcon },
    { href: "/dashboard/admin/bio", title: "Manage Bios", icon: UserCircle },
    { href: "/dashboard/admin/forms", title: "Manage Forms", icon: ClipboardList },
    { href: "/dashboard/admin/users", title: "Manage Users", icon: Shield },
    { href: "/admin/audit", title: "Audit Logs", icon: ScrollText },
]

const SETTINGS: NavItem = { href: "/dashboard/settings", title: "Settings", icon: Settings }

// Roots that have their own sub-pages in other entries match exactly; the rest also match their children.
const EXACT = new Set(["/dashboard", "/admin"])

function isActive(pathname: string, href: string) {
    if (EXACT.has(href)) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
}

export function Sidebar({ mobile, onNavigate }: SidebarProps = {}) {
    const pathname = usePathname()
    const { user } = useAuth()
    const isAdmin = user?.role === "ADMIN"

    const item = ({ href, title, icon: Icon }: NavItem) => {
        const active = isActive(pathname, href)
        return (
            <li key={href}>
                <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                        "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                            ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-border before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand"
                            : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                    )}
                >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {title}
                </Link>
            </li>
        )
    }

    const body = (
        <div className="flex h-full flex-col gap-6 px-3 py-4">
            <ul className="space-y-0.5">{WORKSPACE.map(item)}</ul>
            {isAdmin && (
                <div>
                    <p id="nav-admin" className="mb-1 px-3 text-xs font-medium text-muted-foreground">Admin</p>
                    <ul aria-labelledby="nav-admin" className="space-y-0.5">{ADMIN.map(item)}</ul>
                </div>
            )}
            <ul className="mt-auto space-y-0.5 border-t pt-4">{item(SETTINGS)}</ul>
        </div>
    )

    // Mobile mode — render without the outer nav container (used inside Sheet)
    if (mobile) {
        return <nav aria-label="Main" className="h-full bg-muted/50">{body}</nav>
    }

    return (
        <nav
            aria-label="Main"
            className="sticky top-14 hidden w-60 shrink-0 border-r bg-muted/50 md:block h-[calc(100vh-3.5rem)] supports-[height:100dvh]:h-[calc(100dvh-3.5rem)]"
        >
            {body}
        </nav>
    )
}
