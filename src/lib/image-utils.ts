/**
 * Image optimization utilities
 */

/**
 * Generate a shimmer SVG for blur placeholder
 * Creates an animated gradient effect while image loads
 */
function shimmer(w: number, h: number): string {
  return `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1a1a1a" offset="20%" />
      <stop stop-color="#252525" offset="50%" />
      <stop stop-color="#1a1a1a" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1a1a1a" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`
}

/**
 * Convert SVG to base64 data URL
 */
function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
}

/**
 * Generate blur data URL for image placeholder
 * @param w - width of placeholder
 * @param h - height of placeholder
 */
export function getBlurDataURL(w = 100, h = 150): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`
}

/**
 * Poster aspect ratio blur placeholder (2:3)
 */
export const POSTER_BLUR_DATA_URL = getBlurDataURL(200, 300)

/**
 * Landscape aspect ratio blur placeholder (16:9)
 */
export const LANDSCAPE_BLUR_DATA_URL = getBlurDataURL(320, 180)

/**
 * Square blur placeholder
 */
export const SQUARE_BLUR_DATA_URL = getBlurDataURL(200, 200)

/**
 * Image sizes for responsive loading
 */
export const IMAGE_SIZES = {
  // Poster grid (2-6 columns depending on screen)
  posterGrid: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw',

  // Full width poster in modal
  posterModal: '(max-width: 768px) 100vw, 480px',

  // Thumbnail (small)
  thumbnail: '80px',

  // Cover image (landscape)
  cover: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',

  // EPG poster (fixed width)
  epgPoster: '120px',

  // Binge card
  bingeCard: '140px',
} as const

/**
 * Check if image URL is valid external URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Get optimized image loader props
 */
export function getImageProps(aspectRatio: 'poster' | 'landscape' | 'square' = 'poster') {
  const blurDataURL = {
    poster: POSTER_BLUR_DATA_URL,
    landscape: LANDSCAPE_BLUR_DATA_URL,
    square: SQUARE_BLUR_DATA_URL,
  }[aspectRatio]

  return {
    placeholder: 'blur' as const,
    blurDataURL,
  }
}
