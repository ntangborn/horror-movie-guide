/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow builds to succeed even with linting errors
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ia.media-imdb.com',
        pathname: '/images/**',
      },
    ],
  },
}

export default nextConfig
