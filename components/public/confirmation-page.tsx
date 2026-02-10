"use client"

import { useEffect, useState, useCallback } from "react"
import { ExternalLink, Shield, Clock, ArrowLeft } from "lucide-react"

interface ConfirmationPageProps {
    destinationUrl: string
    title?: string
    code: string
}

export function ConfirmationPage({ destinationUrl, title, code }: ConfirmationPageProps) {
    const [countdown, setCountdown] = useState(5)
    const [favicon, setFavicon] = useState<string | null>(null)
    const [domainName, setDomainName] = useState("")

    // Extract domain info
    useEffect(() => {
        try {
            const url = new URL(destinationUrl)
            setDomainName(url.hostname)
            setFavicon(`https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`)
        } catch {
            setDomainName(destinationUrl)
        }
    }, [destinationUrl])

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) {
            window.location.href = destinationUrl
            return
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [countdown, destinationUrl])

    const handleContinue = useCallback(() => {
        window.location.href = destinationUrl
    }, [destinationUrl])

    const handleGoBack = useCallback(() => {
        window.history.back()
    }, [])

    // Calculate progress for circular countdown
    const progress = ((5 - countdown) / 5) * 100
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Shield className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-semibold">Link Confirmation</h1>
                            <p className="text-slate-400 text-sm">You&apos;re about to be redirected</p>
                        </div>
                    </div>

                    {/* Destination Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-4">
                            {/* Favicon */}
                            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                                {favicon ? (
                                    <img
                                        src={favicon}
                                        alt=""
                                        className="w-8 h-8"
                                        onError={() => setFavicon(null)}
                                    />
                                ) : (
                                    <ExternalLink className="h-5 w-5 text-slate-400" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Title */}
                                {title && (
                                    <h2 className="text-white font-medium text-base mb-1 truncate">
                                        {title}
                                    </h2>
                                )}

                                {/* Domain */}
                                <p className="text-emerald-400 text-sm font-medium mb-1">
                                    {domainName}
                                </p>

                                {/* Full URL */}
                                <p className="text-slate-400 text-xs break-all line-clamp-2">
                                    {destinationUrl}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Countdown + Actions */}
                    <div className="flex items-center gap-4">
                        {/* Countdown Circle */}
                        <div className="relative flex-shrink-0">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="6"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="rgb(52, 211, 153)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">{countdown}</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex-1 space-y-2">
                            <button
                                onClick={handleContinue}
                                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Continue to Site
                            </button>
                            <button
                                onClick={handleGoBack}
                                className="w-full py-2 px-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* Auto-redirect notice */}
                    <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Auto-redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-slate-500 text-xs">
                    Powered by <span className="text-emerald-400 font-medium">Heisenlink</span> 🧪
                </div>
            </div>
        </div>
    )
}
