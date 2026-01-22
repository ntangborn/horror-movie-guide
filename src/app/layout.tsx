import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'
import { TrackingProvider } from '@/components/TrackingProvider'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostguide.co'

export const metadata: Metadata = {
  title: {
    default: 'Ghost Guide - Horror & Sci-Fi TV Guide',
    template: '%s | Ghost Guide',
  },
  description:
    'Discover where to stream your favorite horror movies and sci-fi thrillers. Browse 500+ curated titles with streaming availability, ratings, and expert picks. Your ultimate guide to genre entertainment.',
  keywords: [
    'horror movies',
    'sci-fi movies',
    'thriller movies',
    'streaming guide',
    'where to watch horror',
    'horror tv guide',
    'scary movies streaming',
    'best horror films',
    'sci-fi streaming',
  ],
  authors: [{ name: 'Ghost Guide' }],
  creator: 'Ghost Guide',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Ghost Guide',
    title: 'Ghost Guide - Horror & Sci-Fi TV Guide',
    description:
      'Discover where to stream your favorite horror movies and sci-fi thrillers. Browse 500+ curated titles with streaming availability, ratings, and expert picks.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ghost Guide - Horror & Sci-Fi TV Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghost Guide - Horror & Sci-Fi TV Guide',
    description:
      'Discover where to stream your favorite horror movies and sci-fi thrillers. Browse 500+ curated titles with streaming availability and ratings.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon-180.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white min-h-screen`}
      >
        <Providers>
          <TrackingProvider>
            <Header />
            {children}
          </TrackingProvider>
        </Providers>
      </body>
    </html>
  )
}
