export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center flex flex-col items-center">
                    <img src="/logo-panrb.png" alt="Logo Kementerian PANRB" className="h-24 w-auto mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Heisenlink
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Kementerian PANRB
                    </p>
                </div>
                {children}
            </div>
        </div>
    )
}
