import Link from "next/link"
import { Clock, ArrowLeft } from "lucide-react"

export default function LinkExpiredPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative w-full max-w-lg">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 mb-6">
                        <Clock className="h-10 w-10 text-amber-400" />
                    </div>

                    <h1 className="text-white text-2xl font-bold mb-3">
                        Link Expired
                    </h1>
                    <p className="text-slate-400 text-base mb-8">
                        This link has expired and is no longer accessible. Please contact the link owner for an updated URL.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-200 border border-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="text-center mt-6 text-slate-500 text-xs">
                    Powered by <span className="text-emerald-400 font-medium">Heisenlink</span> 🧪
                </div>
            </div>
        </div>
    )
}
