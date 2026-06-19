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
    title: 'Heisenlink - Kementerian PANRB',
    description: 'Platform shortlink dan bio page resmi Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi',
    icons: {
        icon: '/icon.png',
        apple: '/apple-icon.png',
    },
    openGraph: {
        type: 'website',
        title: 'Heisenlink - Kementerian PANRB',
        description: 'Platform shortlink dan bio page resmi Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi',
        siteName: 'Heisenlink',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Logo Kementerian PANRB',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Heisenlink - Kementerian PANRB',
        description: 'Platform shortlink dan bio page resmi Kementerian PANRB',
        images: ['/og-image.png'],
    },
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
