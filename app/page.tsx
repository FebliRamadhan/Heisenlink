import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Link as LinkIcon, Shield, BarChart3, Globe, Zap, Lock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthButton } from "@/components/landing/auth-button"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden selection:bg-primary/30">
            {/* Abstract Background Shapes */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-teal-500/20 blur-[120px]" />
                <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
                <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-40" />
            </div>

            <header className="px-6 h-20 flex items-center fixed w-full z-50 transition-all duration-300 glass border-b-0">
                <div className="container mx-auto flex items-center justify-between">
                    <Link className="flex items-center justify-center gap-2 font-bold text-2xl tracking-tight" href="#">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-primary/25">
                            <LinkIcon className="h-6 w-6" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            LinkHub
                        </span>
                    </Link>
                    <nav className="ml-auto hidden md:flex gap-8">
                        <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                            Internal Portal
                        </span>
                    </nav>
                    <div className="ml-6 flex items-center gap-3">
                        <AuthButton variant="header" />
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-32 pb-20">
                <section className="container px-4 md:px-6 mx-auto text-center relative z-10">
                    <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm bg-white/30 dark:bg-black/30 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse" />
                        Authorized Access Only
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Centralized <br />
                        <span className="text-gradient">Link Management.</span>
                    </h1>

                    <p className="mx-auto max-w-[700px] text-lg text-muted-foreground mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        The official shortlink and bio page platform for our organization.
                        Streamline internal sharing and external communications securely.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in duration-1000 delay-300">
                        <Link href="/login">
                            <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
                                Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 mx-auto max-w-5xl rounded-xl border bg-background/50 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 group">
                        <div className="h-10 border-b bg-muted/40 flex items-center px-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-zinc-300/80 dark:bg-zinc-700" />
                            <div className="w-3 h-3 rounded-full bg-zinc-300/80 dark:bg-zinc-700" />
                            <div className="w-3 h-3 rounded-full bg-zinc-300/80 dark:bg-zinc-700" />
                            <div className="ml-4 h-6 w-96 rounded-md bg-muted/50 hidden sm:block" />
                        </div>
                        <div className="aspect-[16/9] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 relative p-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-grid-pattern opacity-50" />
                            <div className="relative z-10 text-center space-y-4">
                                <div className="text-4xl font-bold text-gray-300 dark:text-gray-700 select-none">Internal Dashboard</div>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Please log in to manage your department's links.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full py-24 md:py-32 relative">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Platform Capabilities</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Standardized tools for all departments and staff.
                            </p>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            <FeatureCard
                                icon={<Lock className="h-10 w-10 text-primary" />}
                                title="Secure & Private"
                                desc="Data remains within our infrastructure. Strict access controls ensure information security."
                            />
                            <FeatureCard
                                icon={<Globe className="h-10 w-10 text-blue-500" />}
                                title="Official Bio Pages"
                                desc="Create verified 'Link in Bio' pages for official social media channels."
                            />
                            <FeatureCard
                                icon={<BarChart3 className="h-10 w-10 text-orange-500" />}
                                title="Usage Analytics"
                                desc="Monitor engagement on shared resources and internal communications."
                            />
                            <FeatureCard
                                icon={<Zap className="h-10 w-10 text-yellow-500" />}
                                title="Instant Redirection"
                                desc="High-performance routing for seamless user experience."
                            />
                            <FeatureCard
                                icon={<Users className="h-10 w-10 text-green-500" />}
                                title="Team Collaboration"
                                desc="Manage links collectively within your designated department."
                            />
                            <FeatureCard
                                icon={<Shield className="h-10 w-10 text-purple-500" />}
                                title="Compliance Ready"
                                desc="Built to meet internal IT and compliance standards."
                            />
                        </div>
                    </div>
                </section>

                <section className="w-full py-24 relative overflow-x-hidden">
                    <div className="absolute inset-0 bg-primary/5 -skew-y-3 z-0 transform origin-left scale-110" />
                    <div className="container px-4 md:px-6 mx-auto relative z-10">
                        <div className="flex flex-col items-center justify-center space-y-8 text-center bg-white/50 dark:bg-black/50 backdrop-blur-xl p-6 md:p-12 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl max-w-4xl mx-auto">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold tracking-tight">Need Access?</h2>
                                <p className="max-w-[600px] text-muted-foreground text-xl mx-auto">
                                    Contact the IT Administrator to request an account or report issues.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <AuthButton variant="cta" />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 w-full border-t bg-card/50 backdrop-blur-sm z-50 relative">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <LinkIcon className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg">LinkHub</span>
                    </div>
                    <p className="text-sm text-muted-foreground">© 2026 Biro Data dan Teknologi Informasi - KemenPANRB.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex flex-col p-8 rounded-2xl border bg-card/60 glass-card group hover:-translate-y-1 transition-transform duration-300">
            <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm w-fit group-hover:scale-110 transition-transform duration-300 ring-1 ring-black/5 dark:ring-white/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {desc}
            </p>
        </div>
    )
}
