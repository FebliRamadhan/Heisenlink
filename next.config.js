/** @type {import('next').NextConfig} */
const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:4000';

const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
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
