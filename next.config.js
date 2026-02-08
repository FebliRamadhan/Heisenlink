/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Ensure Next.js doesn't conflict with Express API routes
    rewrites: async () => {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4000/api/:path*',
            },
            {
                source: '/uploads/:path*',
                destination: 'http://localhost:4000/uploads/:path*',
            },
        ];
    },
};

export default nextConfig;
