"use client"

import { useState, useTransition } from "react"
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert } from "lucide-react"
import { verifyLinkPassword } from "@/app/password-protect/[slug]/actions"

interface PasswordPromptProps {
    slug: string
}

export function PasswordPrompt({ slug }: PasswordPromptProps) {
    const [password, setPassword] = useState("")
    const [show, setShow] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!password) return

        setError(null)
        startTransition(async () => {
            const result = await verifyLinkPassword(slug, password)
            if (result.ok) {
                window.location.href = result.destinationUrl
                return
            }
            setError(result.message)
            if (result.code === "INVALID_PASSWORD") {
                setPassword("")
            }
        })
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">

            <div className="relative w-full max-w-md">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Lock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-semibold">Link Diproteksi</h1>
                            <p className="text-slate-400 text-sm">Masukkan password untuk melanjutkan</p>
                        </div>
                    </div>

                    <form
                        onSubmit={onSubmit}
                        autoComplete="off"
                        spellCheck={false}
                        noValidate
                    >
                        {/* Honeypot fields untuk menggagalkan heuristik autofill browser/password manager */}
                        <input
                            type="text"
                            name="username"
                            tabIndex={-1}
                            autoComplete="username"
                            aria-hidden="true"
                            className="hidden"
                            readOnly
                            value=""
                        />
                        <input
                            type="password"
                            name="password"
                            tabIndex={-1}
                            autoComplete="current-password"
                            aria-hidden="true"
                            className="hidden"
                            readOnly
                            value=""
                        />

                        <label htmlFor="link-passcode" className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                id="link-passcode"
                                name="link-passcode"
                                type={show ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={pending}
                                autoFocus
                                required
                                autoComplete="one-time-code"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                inputMode="text"
                                data-form-type="other"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-bwignore="true"
                                placeholder="••••••••"
                                className="w-full h-11 rounded-lg border border-slate-600 bg-slate-900 px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                tabIndex={-1}
                                aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                            >
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pending || password.length === 0}
                            className="mt-5 w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500 text-slate-950 font-semibold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Lock className="h-4 w-4" />
                            {pending ? "Memverifikasi…" : "Buka Link"}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="mt-2 w-full py-2 px-4 bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Kembali
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 text-slate-400 text-xs">
                    Powered by <span className="text-amber-400 font-medium">Heisenlink</span>
                </div>
            </div>
        </div>
    )
}
