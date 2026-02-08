"use client"

import { cn } from "@/lib/utils"

const THEMES = [
    { id: 'light', name: 'Light', bg: 'bg-white' },
    { id: 'dark', name: 'Dark', bg: 'bg-gray-900' },
    { id: 'gradient', name: 'Gradient', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
    { id: 'ocean', name: 'Ocean', bg: 'bg-gradient-to-br from-blue-500 to-cyan-400' },
    { id: 'sunset', name: 'Sunset', bg: 'bg-gradient-to-br from-pink-400 to-rose-500' },
    { id: 'forest', name: 'Forest', bg: 'bg-gradient-to-br from-emerald-500 to-green-400' },
    { id: 'midnight', name: 'Midnight', bg: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800' },
    { id: 'rose', name: 'Rose', bg: 'bg-gradient-to-br from-rose-200 to-rose-300' },
    // New themes
    { id: 'neon', name: 'Neon', bg: 'bg-black', accent: 'border-2 border-green-400' },
    { id: 'minimal', name: 'Minimal', bg: 'bg-zinc-50' },
    { id: 'aurora', name: 'Aurora', bg: 'bg-gradient-to-br from-blue-900 via-purple-900 to-teal-900' },
    { id: 'candy', name: 'Candy', bg: 'bg-gradient-to-br from-orange-100 via-orange-200 to-orange-100' },
    { id: 'corporate', name: 'Corporate', bg: 'bg-gray-100' },
]

interface ThemeSelectorProps {
    currentTheme: string
    onSelect: (theme: string) => void
}

export function ThemeSelector({ currentTheme, onSelect }: ThemeSelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {THEMES.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => onSelect(theme.id)}
                    className={cn(
                        "relative group rounded-xl overflow-hidden aspect-[9/16] border-4 transition-all",
                        currentTheme === theme.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground/30"
                    )}
                >
                    <div className={cn("absolute inset-0", theme.bg, theme.accent)}>
                        <div className="absolute inset-x-4 top-8 h-4 rounded-full bg-white/20" />
                        <div className="absolute inset-x-4 top-16 h-12 rounded-lg bg-white/20" />
                        <div className="absolute inset-x-4 top-32 h-12 rounded-lg bg-white/20" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-black/50 text-white text-xs font-medium text-center backdrop-blur-sm">
                        {theme.name}
                    </div>
                </button>
            ))}
        </div>
    )
}
