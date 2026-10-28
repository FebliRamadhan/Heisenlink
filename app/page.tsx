import Link from "next/link"
import { Shield, BarChart3, Globe, Zap, Lock, Users } from "lucide-react"
import { AuthButton } from "@/components/landing/auth-button"
import "./landing.css"

const CAPABILITIES = [
    { icon: Lock, title: "Secure & Private", desc: "Data remains within our infrastructure. Strict access controls ensure information security." },
    { icon: Globe, title: "Official Bio Pages", desc: "Create verified “Link in Bio” pages for official social media channels." },
    { icon: BarChart3, title: "Usage Analytics", desc: "Monitor engagement on shared resources and internal communications." },
    { icon: Zap, title: "Instant Redirection", desc: "High-performance routing from every short link to its destination." },
    { icon: Users, title: "Team Collaboration", desc: "Manage links collectively within your designated department." },
    { icon: Shield, title: "Compliance Ready", desc: "Built to meet internal IT and compliance standards." },
]

export default function Home() {
    return (
        <div className="hl">
            <header className="hl-wrap hl-nav">
                <Link className="hl-brand" href="#">
                    <img src="/logo-panrb.png" alt="Logo Kementerian PANRB" />
                    <span className="hl-brand-name">Heisenlink</span>
                    <span className="hl-brand-sub">Internal Portal</span>
                </Link>
                <AuthButton variant="header" className="hl-btn hl-btn--quiet" />
            </header>

            <main>
                <section className="hl-wrap hl-hero">
                    <div>
                        <h1>Centralized link management</h1>
                        <p className="hl-lead">
                            The official shortlink and bio page platform for our organization.
                        </p>
                        <div className="hl-actions">
                            <Link href="/login" className="hl-btn hl-btn--primary">
                                Access Dashboard
                            </Link>
                            <span className="hl-note">Authorized access only.</span>
                        </div>
                    </div>
                    <figure className="hl-mark">
                        <img
                            src="/logo-panrb.png"
                            alt="Lambang Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi"
                            fetchPriority="high"
                        />
                    </figure>
                </section>

                <section className="hl-wrap hl-caps" aria-labelledby="caps-title">
                    <div className="hl-caps-head">
                        <h2 id="caps-title">Platform capabilities</h2>
                        <p>Standardized tools for all departments and staff.</p>
                    </div>
                    <ul className="hl-ledger">
                        {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                            <li key={title}>
                                <Icon aria-hidden="true" />
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="hl-access" aria-labelledby="access-title">
                    <div className="hl-wrap hl-access-in">
                        <h2 id="access-title">Need access?</h2>
                        <div>
                            <p>Contact the IT Administrator to request an account or report issues.</p>
                            <AuthButton variant="cta" className="hl-btn hl-btn--primary" />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="hl-foot">
                <div className="hl-wrap hl-foot-in">
                    <span className="hl-brand">
                        <img src="/logo-panrb.png" alt="" />
                        <span className="hl-brand-name">Heisenlink</span>
                    </span>
                    <p>© 2026 Biro Data dan Teknologi Informasi, KemenPANRB.</p>
                </div>
            </footer>
        </div>
    )
}
