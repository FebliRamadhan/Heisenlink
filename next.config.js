/** @type {import('next').NextConfig} */
const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:4000';

const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '*.gravatar.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    // Security headers
    headers: async () => [
        {
            source: '/:path*',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                {
                    key: 'Content-Security-Policy',
                    value: [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                        "style-src 'self' 'unsafe-inline'",
                        "img-src 'self' data: https: blob:",
                        "font-src 'self' data:",
                        "connect-src 'self'",
                        "frame-ancestors 'self'",
                    ].join('; '),
                },
            ],
        },
    ],
    // Proxy API requests to backend
    rewrites: async () => {
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${apiUrl}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
