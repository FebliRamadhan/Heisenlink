import Link from "next/link"
import { Clock, ArrowLeft } from "lucide-react"

export default function LinkExpiredPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">

            <div className="relative w-full max-w-lg">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg text-center">
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
                        className="inline-flex items-center gap-2 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors duration-200 border border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="text-center mt-6 text-slate-400 text-xs">
                    Powered by <span className="text-emerald-400 font-medium">Heisenlink</span>
                </div>
            </div>
        </div>
    )
}
