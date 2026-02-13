"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Link as LinkIcon, UserCircle, BarChart2, Settings, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface SidebarProps {
    mobile?: boolean
    onNavigate?: () => void
}

export function Sidebar({ mobile, onNavigate }: SidebarProps = {}) {
    const pathname = usePathname()
    const { user } = useAuth()

    const items = [
        {
            href: "/dashboard",
            title: "Overview",
            icon: LayoutDashboard,
        },
        {
            href: "/dashboard/links",
            title: "My Links",
            icon: LinkIcon,
        },
        {
            href: "/dashboard/bio",
            title: "Bio Page",
            icon: UserCircle,
        },
        {
            href: "/dashboard/analytics",
            title: "Analytics",
            icon: BarChart2,
        },
        {
            href: "/admin/links",
            title: "Manage Links",
            icon: LinkIcon,
            adminOnly: true,
        },
        {
            href: "/admin/bio",
            title: "Manage Bios",
            icon: UserCircle,
            adminOnly: true,
        },
        {
            href: "/admin/users",
            title: "Users",
            icon: Shield,
            adminOnly: true,
        },
        {
            href: "/admin/audit",
            title: "Login Logs",
            icon: Shield,
            adminOnly: true,
        },
        {
            href: "/dashboard/settings",
            title: "Settings",
            icon: Settings,
        },
    ]

    // Mobile mode — render without the outer nav container (used inside Sheet)
    if (mobile) {
        return (
            <div className="flex flex-col h-full bg-gray-50/40 dark:bg-gray-800/40">
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                            Menu
                        </h2>
                        <div className="space-y-1">
                            {items.map((item) => {
                                if (item.adminOnly && user?.role !== 'ADMIN') return null

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                                            pathname.startsWith(item.href) && item.href !== "/dashboard" ? "bg-accent/50" : ""
                                        )}
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Desktop sidebar
    return (
        <nav className="hidden border-r bg-gray-50/40 dark:bg-gray-800/40 md:block w-64 min-h-[calc(100vh-4rem)] supports-[min-height:100dvh]:min-h-[calc(100dvh-4rem)]">
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Menu
                    </h2>
                    <div className="space-y-1">
                        {items.map((item) => {
                            if (item.adminOnly && user?.role !== 'ADMIN') return null

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                        pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                                        pathname.startsWith(item.href) && item.href !== "/dashboard" ? "bg-accent/50" : ""
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}
