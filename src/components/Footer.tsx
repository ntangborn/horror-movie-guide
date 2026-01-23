import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-[#0a0a0a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; 2026 Nick Tangborn and Tangborn Digital Media</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.buymeacoffee.com/ghostguide"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
                alt="Buy Me A Coffee"
                className="h-10"
              />
            </a>
            <a
              href="mailto:nicholas@ghostguide.co"
              className="hover:text-purple-400 transition-colors"
            >
              Contact Me
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
