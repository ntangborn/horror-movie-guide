'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  Globe,
  Lock,
  Film,
  GripVertical,
  X,
  Check,
  Upload,
  Loader2,
  MoreVertical,
  Copy,
  ExternalLink,
  ChevronDown,
  ImageIcon,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Types
interface ListCard {
  id: string
  title: string
  year: number
  poster_url: string | null
}

interface CuratedList {
  id: string
  title: string
  slug: string
  description: string
  cover_image: string | null
  cards: string[] // Array of card IDs in database
  cardDetails?: ListCard[] // Populated card details for display
  type: 'editorial' | 'user-watchlist' | 'user-custom'
  author: string
  featured: boolean
  published: boolean
  created_at: string
  updated_at: string
}

// Map database row to CuratedList
function mapDbRowToList(row: any): CuratedList {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    cover_image: row.cover_image,
    cards: row.cards || [],
    cardDetails: [],
    type: row.type || 'editorial',
    author: row.author || 'Admin',
    featured: row.featured || false,
    published: row.published || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// Helper: Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ============================================
// Create/Edit List Modal
// ============================================
function ListFormModal({
  isOpen,
  list,
  onClose,
  onSave,
}: {
  isOpen: boolean
  list: CuratedList | null
  onClose: () => void
  onSave: (list: CuratedList) => void
}) {
  const isEditing = !!list
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Partial<CuratedList>>({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    featured: false,
    published: false,
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Initialize form when list changes
  useEffect(() => {
    if (list) {
      setFormData({
        title: list.title,
        slug: list.slug,
        description: list.description,
        cover_image: list.cover_image,
        featured: list.featured,
        published: list.published,
      })
      setCoverPreview(list.cover_image || null)
      setSlugManuallyEdited(true)
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        cover_image: '',
        featured: false,
        published: false,
      })
      setCoverPreview(null)
      setSlugManuallyEdited(false)
    }
  }, [list, isOpen])

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: slugManuallyEdited ? prev.slug : generateSlug(value),
    }))
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setFormData((prev) => ({ ...prev, slug: generateSlug(value) }))
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCoverPreview(result)
        setFormData((prev) => ({ ...prev, cover_image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (publish: boolean) => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const savedList: CuratedList = {
      id: list?.id || Date.now().toString(),
      title: formData.title || 'Untitled List',
      slug: formData.slug || generateSlug(formData.title || 'untitled'),
      description: formData.description || '',
      cover_image: formData.cover_image || '',
      cards: list?.cards || [],
      type: 'editorial',
      author: list?.author || 'Admin',
      featured: formData.featured || false,
      published: publish,
      created_at: list?.created_at || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    }

    onSave(savedList)
    setIsSaving(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit List' : 'Create New List'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Cover Image */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Cover Image</label>
            <div
              className="relative aspect-video bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors cursor-pointer overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-sm">Click to upload cover image</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="My Horror Collection"
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              URL Slug
              <span className="text-gray-600 ml-2">
                /lists/{formData.slug || 'my-horror-collection'}
              </span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-horror-collection"
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="A curated collection of horror films..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Featured checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
              className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-gray-300">Featured list (shown on homepage)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !formData.title}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || !formData.title}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save & Publish' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Edit List Cards Modal (Drag & Drop)
// ============================================
function EditCardsModal({
  isOpen,
  list,
  availableCards,
  onClose,
  onSave,
}: {
  isOpen: boolean
  list: CuratedList | null
  availableCards: ListCard[]
  onClose: () => void
  onSave: (list: CuratedList) => void
}) {
  const [cards, setCards] = useState<ListCard[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ListCard[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (list && list.cardDetails) {
      setCards([...list.cardDetails])
    }
  }, [list, isOpen])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = availableCards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !cards.some((c) => c.id === card.id)
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, cards, availableCards])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCards = [...cards]
    const draggedCard = newCards[draggedIndex]
    newCards.splice(draggedIndex, 1)
    newCards.splice(index, 0, draggedCard)
    setCards(newCards)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleAddCard = (card: ListCard) => {
    setCards([...cards, card])
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveCard = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId))
  }

  const handleSave = async () => {
    if (!list) return
    setIsSaving(true)
    // Convert ListCard[] to card ID strings for database storage
    // Deduplicate IDs while preserving order
    const seenIds = new Set<string>()
    const cardIds = cards
      .map(c => c.id)
      .filter(id => {
        if (seenIds.has(id)) return false
        seenIds.add(id)
        return true
      })
    const dedupedCards = cards.filter((c, i) => cards.findIndex(x => x.id === c.id) === i)
    await onSave({ ...list, cards: cardIds, cardDetails: dedupedCards, updated_at: new Date().toISOString().split('T')[0] })
    setIsSaving(false)
    onClose()
  }

  if (!isOpen || !list) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Cards</h2>
            <p className="text-sm text-gray-500">{list.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/lists/${list.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Cards list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">{cards.length} cards in list</h3>
              <span className="text-sm text-gray-500">Drag to reorder</span>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cards in this list yet</p>
                <p className="text-sm">Search and add cards from the right panel</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800
                      cursor-grab active:cursor-grabbing
                      ${draggedIndex === index ? 'opacity-50 border-purple-500' : ''}
                      hover:border-gray-700 transition-colors
                    `}
                  >
                    <GripVertical className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-500 font-mono text-sm w-6">{index + 1}</span>
                    <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {card.poster_url ? (
                        <img
                          src={card.poster_url}
                          alt={card.title}
                          className="w-full h-full rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <Film className={`w-5 h-5 text-gray-600 ${card.poster_url ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{card.title}</p>
                      <p className="text-sm text-gray-500">{card.year}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="p-1.5 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search panel */}
          <div className="w-72 border-l border-gray-800 p-4 overflow-y-auto bg-[#0f0f0f]">
            <h3 className="font-medium text-white mb-3">Add Cards</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleAddCard(card)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg bg-[#1a1a1a] border border-gray-800 hover:border-purple-500 transition-colors text-left"
                  >
                    <div className="w-8 h-11 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <Film className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{card.title}</p>
                      <p className="text-xs text-gray-500">{card.year}</p>
                    </div>
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-sm text-gray-500 text-center py-4">No results found</p>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Type to search for titles</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Delete Confirmation Modal
// ============================================
function DeleteConfirmModal({
  isOpen,
  count,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  count: number
  onClose: () => void
  onConfirm: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Delete {count > 1 ? 'Lists' : 'List'}</h2>
        <p className="text-gray-400 mb-4">
          Are you sure you want to delete {count} {count > 1 ? 'lists' : 'list'}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// List Card Component
// ============================================
function ListCard({
  list,
  selected,
  onSelect,
  onEdit,
  onEditCards,
  onDelete,
  onToggleFeatured,
  onTogglePublished,
}: {
  list: CuratedList
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onEditCards: () => void
  onDelete: () => void
  onToggleFeatured: () => void
  onTogglePublished: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={`
        bg-[#141414] rounded-xl border overflow-hidden transition-all
        ${selected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-800 hover:border-gray-700'}
      `}
    >
      {/* Cover */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-gray-900">
        {list.cover_image ? (
          <img
            src={list.cover_image}
            alt={list.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-700" />
          </div>
        )}

        {/* Selection checkbox */}
        <div className="absolute top-3 left-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`
              w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
              ${selected
                ? 'bg-purple-600 border-purple-600'
                : 'bg-black/50 border-gray-500 hover:border-white'
              }
            `}
          >
            {selected && <Check className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Status badges */}
        <div className="absolute top-3 right-12 flex gap-2">
          {list.featured && (
            <span className="px-2 py-0.5 bg-yellow-600/90 text-white text-xs font-medium rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          )}
        </div>

        {/* Menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>
                <button
                  onClick={() => { onEditCards(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  Edit Cards
                </button>
                <button
                  onClick={() => { onToggleFeatured(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  {list.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  {list.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => { onTogglePublished(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  {list.published ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  {list.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link
                  href={`/lists/${list.slug}`}
                  target="_blank"
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live
                </Link>
                <hr className="my-1 border-gray-800" />
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Published status badge */}
        <div className="absolute bottom-3 left-3">
          {list.published ? (
            <span className="px-2 py-0.5 bg-green-600/90 text-white text-xs font-medium rounded flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Published
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-gray-700/90 text-gray-300 text-xs font-medium rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{list.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{list.description || 'No description'}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{list.cards.length} titles</span>
          <span>Updated {list.updated_at}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================
export default function AdminListsPage() {
  const [lists, setLists] = useState<CuratedList[]>([])
  const [availableCards, setAvailableCards] = useState<ListCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'featured'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch lists from Supabase
  const fetchLists = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('curated_lists')
        .select('*')
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      const mappedLists = (data || []).map(mapDbRowToList)

      // Fetch card details for each list
      const allCardIds = new Set<string>()
      mappedLists.forEach(list => {
        list.cards.forEach(cardId => allCardIds.add(cardId))
      })

      if (allCardIds.size > 0) {
        const { data: cardsData } = await supabase
          .from('availability_cards')
          .select('id, title, year, poster_url')
          .in('id', Array.from(allCardIds))

        const cardsMap = new Map<string, ListCard>()
        cardsData?.forEach(card => {
          cardsMap.set(card.id, card)
        })

        // Populate cardDetails for each list
        mappedLists.forEach(list => {
          list.cardDetails = list.cards
            .map(cardId => cardsMap.get(cardId))
            .filter((card): card is ListCard => card !== undefined)
        })
      }

      setLists(mappedLists)
    } catch (err) {
      console.error('Error fetching lists:', err)
      setError('Failed to load lists. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch available cards for search
  const fetchAvailableCards = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('availability_cards')
        .select('id, title, year, poster_url')
        .order('title')

      setAvailableCards(data || [])
    } catch (err) {
      console.error('Error fetching available cards:', err)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchLists()
    fetchAvailableCards()
  }, [fetchLists, fetchAvailableCards])

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editCardsModalOpen, setEditCardsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<CuratedList | null>(null)

  // Filter lists
  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && list.published) ||
      (filterStatus === 'draft' && !list.published) ||
      (filterStatus === 'featured' && list.featured)
    return matchesSearch && matchesStatus
  })

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredLists.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLists.map((l) => l.id)))
    }
  }

  // Bulk actions
  const bulkToggleFeatured = async (featured: boolean) => {
    try {
      const ids = Array.from(selectedIds)
      const { error: updateError } = await supabase
        .from('curated_lists')
        .update({ featured, updated_at: new Date().toISOString() })
        .in('id', ids)

      if (updateError) throw updateError

      setLists(
        lists.map((l) =>
          selectedIds.has(l.id) ? { ...l, featured } : l
        )
      )
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error bulk updating featured:', err)
    }
  }

  const bulkTogglePublished = async (published: boolean) => {
    try {
      const ids = Array.from(selectedIds)
      const { error: updateError } = await supabase
        .from('curated_lists')
        .update({ published, updated_at: new Date().toISOString() })
        .in('id', ids)

      if (updateError) throw updateError

      setLists(
        lists.map((l) =>
          selectedIds.has(l.id) ? { ...l, published } : l
        )
      )
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error bulk updating published:', err)
    }
  }

  const bulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds)
      const { error: deleteError } = await supabase
        .from('curated_lists')
        .delete()
        .in('id', ids)

      if (deleteError) throw deleteError

      setLists(lists.filter((l) => !selectedIds.has(l.id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error bulk deleting:', err)
      alert('Failed to delete lists. Please try again.')
    }
  }

  // CRUD handlers
  const handleSaveList = async (list: CuratedList): Promise<void> => {
    try {
      // Ensure cards array is deduplicated
      const uniqueCards = Array.from(new Set(list.cards))

      const existing = lists.find((l) => l.id === list.id)
      if (existing) {
        // Update existing list
        const { error: updateError } = await supabase
          .from('curated_lists')
          .update({
            title: list.title,
            slug: list.slug,
            description: list.description,
            cover_image: list.cover_image,
            cards: uniqueCards,
            featured: list.featured,
            published: list.published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', list.id)

        if (updateError) throw updateError

        console.log('List saved with cards:', uniqueCards.length)
      } else {
        // Insert new list
        const { error: insertError } = await supabase
          .from('curated_lists')
          .insert({
            title: list.title,
            slug: list.slug,
            description: list.description,
            cover_image: list.cover_image,
            cards: uniqueCards,
            type: 'editorial',
            author: 'Admin',
            featured: list.featured,
            published: list.published,
          })

        if (insertError) throw insertError
      }

      await fetchLists()
    } catch (err) {
      console.error('Error saving list:', err)
      alert('Failed to save list. Please try again.')
    }
  }

  const handleDelete = (list: CuratedList) => {
    setSelectedList(list)
    setSelectedIds(new Set([list.id]))
    setDeleteModalOpen(true)
  }

  const handleToggleFeatured = async (list: CuratedList) => {
    try {
      const { error: updateError } = await supabase
        .from('curated_lists')
        .update({
          featured: !list.featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', list.id)

      if (updateError) throw updateError

      setLists(
        lists.map((l) =>
          l.id === list.id ? { ...l, featured: !l.featured } : l
        )
      )
    } catch (err) {
      console.error('Error toggling featured:', err)
    }
  }

  const handleTogglePublished = async (list: CuratedList) => {
    try {
      const { error: updateError } = await supabase
        .from('curated_lists')
        .update({
          published: !list.published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', list.id)

      if (updateError) throw updateError

      setLists(
        lists.map((l) =>
          l.id === list.id ? { ...l, published: !l.published } : l
        )
      )
    } catch (err) {
      console.error('Error toggling published:', err)
    }
  }

  // Stats
  const totalLists = lists.length
  const publishedCount = lists.filter((l) => l.published).length
  const featuredCount = lists.filter((l) => l.featured).length
  const totalCards = lists.reduce((acc, l) => acc + (l.cardDetails?.length || l.cards.length), 0)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Curated Lists</h1>
            <p className="text-gray-500">Create and manage movie collections</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-3 text-gray-400">Loading lists...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Curated Lists</h1>
            <p className="text-gray-500">Create and manage movie collections</p>
          </div>
        </div>
        <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-400 mb-2">Failed to load lists</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchLists}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Curated Lists</h1>
          <p className="text-gray-500">Create and manage movie collections</p>
        </div>
        <button
          onClick={() => {
            setSelectedList(null)
            setFormModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create List
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">{totalLists}</p>
          <p className="text-sm text-gray-500">Total Lists</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">{publishedCount}</p>
          <p className="text-sm text-gray-500">Published</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">{featuredCount}</p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">{totalCards}</p>
          <p className="text-sm text-gray-500">Total Titles</p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex bg-[#1a1a1a] rounded-lg border border-gray-800 p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Drafts' },
            { value: 'featured', label: 'Featured' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as typeof filterStatus)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === filter.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-purple-600/10 border border-purple-500/30 rounded-lg">
          <span className="text-sm text-purple-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkToggleFeatured(true)}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              Feature
            </button>
            <button
              onClick={() => bulkToggleFeatured(false)}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 flex items-center gap-1"
            >
              <StarOff className="w-3 h-3" />
              Unfeature
            </button>
            <button
              onClick={() => bulkTogglePublished(true)}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              Publish
            </button>
            <button
              onClick={() => bulkTogglePublished(false)}
              className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Unpublish
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-3 py-1.5 rounded bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-gray-400 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Select all */}
      {filteredLists.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            {selectedIds.size === filteredLists.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Lists grid */}
      {filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              selected={selectedIds.has(list.id)}
              onSelect={() => toggleSelect(list.id)}
              onEdit={() => {
                setSelectedList(list)
                setFormModalOpen(true)
              }}
              onEditCards={() => {
                setSelectedList(list)
                setEditCardsModalOpen(true)
              }}
              onDelete={() => handleDelete(list)}
              onToggleFeatured={() => handleToggleFeatured(list)}
              onTogglePublished={() => handleTogglePublished(list)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-12 text-center">
          <Film className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No lists found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Create your first list to get started'}
          </p>
          <button
            onClick={() => {
              setSelectedList(null)
              setFormModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create List
          </button>
        </div>
      )}

      {/* Modals */}
      <ListFormModal
        isOpen={formModalOpen}
        list={selectedList}
        onClose={() => {
          setFormModalOpen(false)
          setSelectedList(null)
        }}
        onSave={handleSaveList}
      />

      <EditCardsModal
        isOpen={editCardsModalOpen}
        list={selectedList}
        availableCards={availableCards}
        onClose={() => {
          setEditCardsModalOpen(false)
          setSelectedList(null)
        }}
        onSave={handleSaveList}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        count={selectedIds.size}
        onClose={() => {
          setDeleteModalOpen(false)
          if (selectedIds.size === 1) {
            setSelectedIds(new Set())
          }
        }}
        onConfirm={bulkDelete}
      />
    </div>
  )
}
