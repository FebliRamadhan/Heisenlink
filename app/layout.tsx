import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Providers from './providers'
import { cn } from '@/lib/utils'

const fontSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
})

export const metadata: Metadata = {
    title: 'LinkHub - Enterprise Shortlink & Bio Platform',
    description: 'Internal platform for shortlinks and bio pages',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn("min-h-screen bg-background font-sans antialiased selection:bg-primary/20", fontSans.variable)}>
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    )
}
