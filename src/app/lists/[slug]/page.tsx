import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ghost,
  Clock,
  Film,
  User,
  Check,
  ChevronRight,
} from 'lucide-react'
import { NumberedTitleCard } from '@/components/NumberedTitleCard'
import { ShareButton, AddToBingeButton } from '@/components/ListActions'
import {
  getListWithCardsServer,
  getRelatedListsServer,
  getFeaturedListSlugsServer,
  getListTotalRuntime,
  formatTotalRuntime,
} from '@/lib/list-data-server'
import type { CuratedList } from '@/types'

// Generate static params for featured lists (SEO)
export async function generateStaticParams() {
  const slugs = await getFeaturedListSlugsServer()
  return slugs.map((slug) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getListWithCardsServer(slug)

  if (!data) {
    return {
      title: 'List Not Found | Ghosts in the Machine',
    }
  }

  return {
    title: `${data.list.title} | Ghosts in the Machine`,
    description: data.list.description,
  }
}

/**
 * Related list card
 */
function RelatedListCard({ list }: { list: CuratedList }) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="
        group block rounded-xl overflow-hidden
        bg-[#141414] hover:bg-[#1a1a1a] border border-gray-800/50 hover:border-purple-500/30
        transition-all duration-300
      "
    >
      {/* Cover image */}
      <div className="relative aspect-video">
        {list.cover_image ? (
          <Image
            src={list.cover_image}
            alt={list.title}
            fill
            sizes="400px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
            {list.title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {list.cards.length} titles
          </p>
        </div>
      </div>
    </Link>
  )
}

/**
 * List header component
 */
function ListHeader({
  list,
  cardCount,
  totalRuntime,
}: {
  list: CuratedList
  cardCount: number
  totalRuntime: string
}) {
  return (
    <div className="relative">
      {/* Cover image */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        {list.cover_image ? (
          <Image
            src={list.cover_image}
            alt={list.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* List type badge */}
          {list.type === 'editorial' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-300 bg-purple-600/20 px-2 py-1 rounded-full mb-4">
              <Check className="w-3 h-3" />
              Editorial Collection
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {list.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4" />
              {cardCount} titles
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {totalRuntime} total
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {list.author}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-300 max-w-2xl mb-6">{list.description}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <AddToBingeButton listId={list.id} listTitle={list.title} />
            <ShareButton slug={list.slug} title={list.title} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for cards
 */
function CardsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-xl bg-[#141414] animate-pulse"
        >
          <div className="w-12 flex items-center justify-center">
            <div className="w-8 h-10 bg-gray-800 rounded" />
          </div>
          <div className="w-24 aspect-[2/3] bg-gray-800 rounded-lg" />
          <div className="flex-1 py-1">
            <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-800 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Main list page component
 */
export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getListWithCardsServer(slug)

  if (!data) {
    notFound()
  }

  const { list, cards } = data
  const totalRuntime = formatTotalRuntime(getListTotalRuntime(cards))
  const relatedLists = await getRelatedListsServer(slug, 3)

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Ghost className="w-8 h-8 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Ghosts in the Machine
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                TV Guide
              </Link>
              <Link
                href="/browse"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/binge"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Binge Now
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* List Header */}
      <ListHeader list={list} cardCount={cards.length} totalRuntime={totalRuntime} />

      {/* Cards Section */}
      <section className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            All Titles
          </h2>
          <span className="text-sm text-gray-500">
            {cards.length} in this collection
          </span>
        </div>

        <Suspense fallback={<CardsSkeleton />}>
          <div className="space-y-4">
            {cards.map((card, index) => (
              <NumberedTitleCard
                key={card.id}
                card={card}
                position={index + 1}
              />
            ))}
          </div>
        </Suspense>

        {cards.length === 0 && (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">This list is empty</p>
          </div>
        )}
      </section>

      {/* Related Lists */}
      {relatedLists.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 py-12 border-t border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              More Collections
            </h2>
            <Link
              href="/binge"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedLists.map((relatedList) => (
              <RelatedListCard key={relatedList.id} list={relatedList} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 py-8 border-t border-gray-800 text-center">
        <p className="text-gray-700 text-sm">
          Ghosts in the Machine &copy; {new Date().getFullYear()} | Horror & Sci-Fi TV Guide
        </p>
      </footer>
    </main>
  )
}
