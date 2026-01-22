import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-[#0a0a0a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; 2026 Nick Tangborn and Tangborn Digital Media</p>
          <a
            href="mailto:nicholas@ghostguide.co"
            className="hover:text-purple-400 transition-colors"
          >
            Contact Me
          </a>
        </div>
      </div>
    </footer>
  )
}
