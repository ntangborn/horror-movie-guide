'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import {
  Search,
  Plus,
  Upload,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Star,
  StarOff,
  Film,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ExternalLink,
  Download,
  Pencil,
  ImageIcon,
  FileText,
  Tv,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Types
interface Title {
  id: string
  imdb_id: string
  tmdb_id?: string
  watchmode_id?: string
  title: string
  year: number
  type: 'movie' | 'series'
  poster_url: string | null
  sources: any[]
  featured: boolean
  genres: string[]
  subgenres: string[]
  editorial_tags: string[]
  updated_at: string
  created_at: string
}

// Computed property for sources count
function getSourcesCount(title: Title): number {
  return title.sources?.length || 0
}

// Map database row to Title interface
function mapDbRowToTitle(row: any): Title {
  return {
    id: row.id,
    imdb_id: row.imdb_id,
    tmdb_id: row.tmdb_id,
    watchmode_id: row.watchmode_id,
    title: row.title,
    year: row.year,
    type: row.type || 'movie',
    poster_url: row.poster_url,
    sources: row.sources || [],
    featured: row.featured || false,
    genres: row.genres || [],
    subgenres: row.subgenres || [],
    editorial_tags: row.editorial_tags || [],
    updated_at: row.updated_at,
    created_at: row.created_at,
  }
}

interface CSVRow {
  imdb_id: string
  title?: string
  year?: string
  subgenres?: string
  editorial_tags?: string
  list_slug?: string
}

interface ImportResult {
  imdb_id: string
  title: string
  status: 'added' | 'skipped' | 'error'
  message?: string
}

// ============================================
// Add Title Modal
// ============================================
function AddTitleModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: Title) => void
}) {
  const [imdbId, setImdbId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedData, setFetchedData] = useState<Partial<Title> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subgenres, setSubgenres] = useState('')
  const [editorialTags, setEditorialTags] = useState('')
  const [featured, setFeatured] = useState(false)

  const handleFetch = async () => {
    if (!imdbId.match(/^tt\d{7,}$/)) {
      setError('Invalid IMDB ID format. Use format: tt1234567')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/lookup-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imdb_id: imdbId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch title data')
        return
      }

      setFetchedData({
        imdb_id: data.imdb_id,
        title: data.title,
        year: data.year,
        type: data.type,
        poster_url: data.poster_url,
        sources: data.sources || [],
        genres: data.genres || ['Horror'],
      })
    } catch {
      setError('Failed to fetch title data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!fetchedData) return

    setIsLoading(true)
    setError(null)

    try {
      const newTitle = {
        imdb_id: fetchedData.imdb_id || imdbId,
        title: fetchedData.title || 'Unknown Title',
        year: fetchedData.year || new Date().getFullYear(),
        type: fetchedData.type || 'movie',
        poster_url: fetchedData.poster_url || null,
        sources: fetchedData.sources || [],
        featured,
        genres: fetchedData.genres || [],
        subgenres: subgenres.split(',').map((s) => s.trim()).filter(Boolean),
        editorial_tags: editorialTags.split(',').map((s) => s.trim()).filter(Boolean),
      }

      const response = await fetch('/api/admin/add-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTitle),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add title')
      }

      onAdd(mapDbRowToTitle(result.data))
      handleClose()
    } catch (err: any) {
      console.error('Error saving title:', err)
      setError(err.message || 'Failed to save title. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setImdbId('')
    setFetchedData(null)
    setError(null)
    setSubgenres('')
    setEditorialTags('')
    setFeatured(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Add New Title</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* IMDB ID input */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">IMDB ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imdbId}
                onChange={(e) => setImdbId(e.target.value)}
                placeholder="tt1234567"
                className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleFetch}
                disabled={isLoading || !imdbId}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Fetch
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 mt-1">{error}</p>
            )}
          </div>

          {/* Fetched data preview */}
          {fetchedData && (
            <>
              <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                <div className="flex gap-4">
                  <div className="w-16 h-24 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                    {fetchedData.poster_url ? (
                      <img
                        src={fetchedData.poster_url}
                        alt={fetchedData.title || ''}
                        width={64}
                        height={96}
                        className="rounded object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <Film className={`w-8 h-8 text-gray-600 ${fetchedData.poster_url ? 'hidden' : ''}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{fetchedData.title}</h3>
                    <p className="text-sm text-gray-400">{fetchedData.year}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {fetchedData.sources?.length || 0} streaming sources found
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional fields */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Subgenres <span className="text-gray-600">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={subgenres}
                  onChange={(e) => setSubgenres(e.target.value)}
                  placeholder="Slasher, Supernatural, Body Horror"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Editorial Tags <span className="text-gray-600">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={editorialTags}
                  onChange={(e) => setEditorialTags(e.target.value)}
                  placeholder="Classic, Must Watch, Hidden Gem"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">Featured title</span>
              </label>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!fetchedData}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Title
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Edit Title Modal
// ============================================
function EditTitleModal({
  isOpen,
  title,
  onClose,
  onSave,
}: {
  isOpen: boolean
  title: Title | null
  onClose: () => void
  onSave: (title: Title) => void
}) {
  const [formData, setFormData] = useState<Title | null>(null)

  // Update form when title changes
  useState(() => {
    if (title) {
      setFormData({ ...title })
    }
  })

  if (!isOpen || !title) return null

  const currentData = formData || title

  const handleSave = () => {
    if (currentData) {
      onSave(currentData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Edit Title</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-28 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentData.poster_url ? (
                <img
                  src={currentData.poster_url}
                  alt={currentData.title}
                  width={80}
                  height={112}
                  className="rounded object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <Film className={`w-8 h-8 text-gray-600 ${currentData.poster_url ? 'hidden' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">IMDB: {currentData.imdb_id}</p>
              <h3 className="text-lg font-semibold text-white">{currentData.title}</h3>
              <p className="text-gray-400">{currentData.year}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Subgenres</label>
            <input
              type="text"
              value={currentData.subgenres.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...currentData,
                  subgenres: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Editorial Tags</label>
            <input
              type="text"
              value={currentData.editorial_tags.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...currentData,
                  editorial_tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentData.featured}
              onChange={(e) =>
                setFormData({ ...currentData, featured: e.target.checked })
              }
              className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-gray-300">Featured title</span>
          </label>
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
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Bulk Import Modal
// ============================================
function BulkImportModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (results: ImportResult[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload')
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<ImportResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setParseError(`Parse error: ${result.errors[0].message}`)
          return
        }

        // Validate required columns
        const requiredColumns = ['imdb_id']
        const headers = Object.keys(result.data[0] || {})
        const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

        if (missingColumns.length > 0) {
          setParseError(`Missing required columns: ${missingColumns.join(', ')}`)
          return
        }

        // Filter valid rows
        const validRows = result.data.filter((row) => row.imdb_id?.match(/^tt\d{7,}$/))

        if (validRows.length === 0) {
          setParseError('No valid IMDB IDs found in CSV')
          return
        }

        setParsedData(validRows)
        setStep('preview')
      },
      error: (error) => {
        setParseError(`Failed to parse CSV: ${error.message}`)
      },
    })
  }

  const processImport = async () => {
    setStep('processing')
    setIsProcessing(true)
    setProgress({ current: 0, total: parsedData.length })

    const batchSize = 5
    const importResults: ImportResult[] = []

    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize)

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (row) => {
          // Simulate API call with random delay
          await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

          // Simulate different outcomes
          const random = Math.random()
          if (random < 0.1) {
            return {
              imdb_id: row.imdb_id,
              title: row.title || 'Unknown',
              status: 'error' as const,
              message: 'Failed to fetch from OMDB',
            }
          } else if (random < 0.2) {
            return {
              imdb_id: row.imdb_id,
              title: row.title || 'Unknown',
              status: 'skipped' as const,
              message: 'Already exists in database',
            }
          } else {
            return {
              imdb_id: row.imdb_id,
              title: row.title || `Title for ${row.imdb_id}`,
              status: 'added' as const,
            }
          }
        })
      )

      importResults.push(...batchResults)
      setProgress({ current: Math.min(i + batchSize, parsedData.length), total: parsedData.length })
      setResults([...importResults])
    }

    setIsProcessing(false)
    setStep('results')
    onComplete(importResults)
  }

  const handleClose = () => {
    setStep('upload')
    setParsedData([])
    setParseError(null)
    setProgress({ current: 0, total: 0 })
    setResults([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  const addedCount = results.filter((r) => r.status === 'added').length
  const skippedCount = results.filter((r) => r.status === 'skipped').length
  const errorCount = results.filter((r) => r.status === 'error').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={step !== 'processing' ? handleClose : undefined} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Bulk Import Titles</h2>
          {step !== 'processing' && (
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Click to upload CSV file</p>
                <p className="text-sm text-gray-500">or drag and drop</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{parseError}</p>
                </div>
              )}

              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Expected CSV Format</h3>
                <code className="block text-sm text-gray-400 bg-black/30 p-3 rounded overflow-x-auto">
                  imdb_id,title,year,subgenres,editorial_tags,list_slug<br />
                  tt0087800,A Nightmare on Elm Street,1984,&quot;Slasher,Supernatural&quot;,&quot;Classic,80s&quot;,nightmare-marathon<br />
                  tt0077651,Halloween,1978,Slasher,&quot;Classic,Iconic&quot;,halloween-timeline
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Only <strong>imdb_id</strong> is required. Other fields are optional.
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  <strong className="text-white">{parsedData.length}</strong> titles ready to import
                </p>
                <button
                  onClick={() => setStep('upload')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Choose different file
                </button>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#1a1a1a]">
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-500 font-medium">#</th>
                        <th className="text-left p-3 text-gray-500 font-medium">IMDB ID</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Title</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Year</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 50).map((row, index) => (
                        <tr key={index} className="border-b border-gray-800/50">
                          <td className="p-3 text-gray-600">{index + 1}</td>
                          <td className="p-3 text-white font-mono">{row.imdb_id}</td>
                          <td className="p-3 text-gray-300">{row.title || '-'}</td>
                          <td className="p-3 text-gray-400">{row.year || '-'}</td>
                          <td className="p-3 text-gray-500 truncate max-w-[150px]">
                            {row.editorial_tags || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 50 && (
                  <div className="p-3 bg-gray-800/50 text-center text-sm text-gray-500">
                    ...and {parsedData.length - 50} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                <p className="text-white font-medium">Importing titles...</p>
                <p className="text-sm text-gray-500 mt-1">
                  {progress.current} of {progress.total} processed
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>

              {/* Live results */}
              <div className="flex justify-center gap-6 text-sm">
                <span className="text-green-400">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  {addedCount} added
                </span>
                <span className="text-yellow-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {skippedCount} skipped
                </span>
                <span className="text-red-400">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {errorCount} errors
                </span>
              </div>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-400">{addedCount}</p>
                  <p className="text-sm text-green-300">Added</p>
                </div>
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-400">{skippedCount}</p>
                  <p className="text-sm text-yellow-300">Skipped</p>
                </div>
                <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">{errorCount}</p>
                  <p className="text-sm text-red-300">Errors</p>
                </div>
              </div>

              {/* Details */}
              {(skippedCount > 0 || errorCount > 0) && (
                <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
                  <div className="p-3 border-b border-gray-800">
                    <h3 className="font-medium text-white">Details</h3>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {results
                      .filter((r) => r.status !== 'added')
                      .map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border-b border-gray-800/50"
                        >
                          {result.status === 'skipped' ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="font-mono text-sm text-gray-400">{result.imdb_id}</span>
                          <span className="text-sm text-gray-500">{result.message}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Start Import
              </button>
            </>
          )}

          {step === 'results' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500"
            >
              Done
            </button>
          )}
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
  title,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  title: Title | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!isOpen || !title) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Delete Title</h2>
        <p className="text-gray-400 mb-4">
          Are you sure you want to delete <strong className="text-white">{title.title}</strong>?
          This action cannot be undone.
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
// Streaming Source interface for manual enrichment
// ============================================
interface StreamingSource {
  name: string
  type: 'subscription' | 'free' | 'rent' | 'buy'
  url: string
  region: string
  price?: string
  quality?: string
}

// ============================================
// Manual Enrich Modal
// ============================================
function ManualEnrichModal({
  isOpen,
  title,
  onClose,
  onSave,
}: {
  isOpen: boolean
  title: Title | null
  onClose: () => void
  onSave: (updates: Partial<Title> & { id: string }) => void
}) {
  const [activeTab, setActiveTab] = useState<'poster' | 'metadata' | 'sources'>('poster')
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [posterUrl, setPosterUrl] = useState('')
  const [backdropUrl, setBackdropUrl] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [runtime, setRuntime] = useState('')
  const [mpaaRating, setMpaaRating] = useState('')
  const [director, setDirector] = useState('')
  const [country, setCountry] = useState('')
  const [genres, setGenres] = useState('')
  const [imdbRating, setImdbRating] = useState('')
  const [rtScore, setRtScore] = useState('')
  const [letterboxdRating, setLetterboxdRating] = useState('')
  const [sources, setSources] = useState<StreamingSource[]>([])

  // Source editor state
  const [editingSourceIndex, setEditingSourceIndex] = useState<number | null>(null)
  const [newSource, setNewSource] = useState<StreamingSource>({
    name: '',
    type: 'subscription',
    url: '',
    region: 'US',
    price: '',
    quality: '',
  })
  const [showAddSource, setShowAddSource] = useState(false)

  // Reset form when title changes
  useEffect(() => {
    if (title) {
      setPosterUrl(title.poster_url || '')
      setBackdropUrl((title as any).backdrop_url || '')
      setSynopsis((title as any).synopsis || '')
      setRuntime((title as any).runtime_minutes?.toString() || '')
      setMpaaRating((title as any).mpaa_rating || '')
      setDirector((title as any).director || '')
      setCountry((title as any).country || '')
      setGenres(title.genres?.join(', ') || '')
      setImdbRating((title as any).imdb_rating?.toString() || '')
      setRtScore((title as any).rt_score?.toString() || '')
      setLetterboxdRating((title as any).letterboxd_rating?.toString() || '')
      setSources(
        (title.sources || []).map((s: any) => ({
          name: s.name || s.source_name || '',
          type: s.type || 'subscription',
          url: s.url || s.web_url || '',
          region: s.region || 'US',
          price: s.price || '',
          quality: s.quality || '',
        }))
      )
    }
  }, [title])

  const handleSave = async () => {
    if (!title) return
    setIsLoading(true)

    const updates: any = {
      id: title.id,
      poster_url: posterUrl || null,
      backdrop_url: backdropUrl || null,
      synopsis: synopsis || null,
      runtime_minutes: runtime ? parseInt(runtime, 10) : null,
      mpaa_rating: mpaaRating || null,
      director: director || null,
      country: country || null,
      genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
      imdb_rating: imdbRating ? parseFloat(imdbRating) : null,
      rt_score: rtScore ? parseInt(rtScore, 10) : null,
      letterboxd_rating: letterboxdRating ? parseFloat(letterboxdRating) : null,
      sources: sources.map((s) => ({
        source_name: s.name,
        name: s.name,
        type: s.type,
        web_url: s.url,
        url: s.url,
        region: s.region,
        price: s.price || null,
        quality: s.quality || null,
      })),
    }

    await onSave(updates)
    setIsLoading(false)
  }

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) return
    setSources([...sources, { ...newSource }])
    setNewSource({
      name: '',
      type: 'subscription',
      url: '',
      region: 'US',
      price: '',
      quality: '',
    })
    setShowAddSource(false)
  }

  const handleUpdateSource = (index: number, updatedSource: StreamingSource) => {
    const newSources = [...sources]
    newSources[index] = updatedSource
    setSources(newSources)
    setEditingSourceIndex(null)
  }

  const handleDeleteSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  if (!isOpen || !title) return null

  const tabs = [
    { id: 'poster', label: 'Poster & Media', icon: ImageIcon },
    { id: 'metadata', label: 'Metadata', icon: FileText },
    { id: 'sources', label: 'Streaming Sources', icon: Tv },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Manual Enrich</h2>
            <p className="text-sm text-gray-500">{title.title} ({title.year})</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 -mb-px'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Poster & Media Tab */}
          {activeTab === 'poster' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Poster URL</label>
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                />
                {posterUrl && (
                  <div className="mt-3 flex justify-center">
                    <div className="w-32 h-48 bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={posterUrl}
                        alt="Poster preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = ''
                          e.currentTarget.alt = 'Failed to load'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Backdrop URL (optional)</label>
                <input
                  type="text"
                  value={backdropUrl}
                  onChange={(e) => setBackdropUrl(e.target.value)}
                  placeholder="https://example.com/backdrop.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                />
                {backdropUrl && (
                  <div className="mt-3">
                    <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={backdropUrl}
                        alt="Backdrop preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = ''
                          e.currentTarget.alt = 'Failed to load'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Synopsis</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Enter plot synopsis..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Runtime (minutes)</label>
                  <input
                    type="number"
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">MPAA Rating</label>
                  <select
                    value={mpaaRating}
                    onChange={(e) => setMpaaRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select rating</option>
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                    <option value="NR">NR (Not Rated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Director</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="John Carpenter"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="USA"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Genres <span className="text-gray-600">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="Horror, Thriller, Slasher"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">IMDB Rating (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={imdbRating}
                    onChange={(e) => setImdbRating(e.target.value)}
                    placeholder="7.5"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">RT Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rtScore}
                    onChange={(e) => setRtScore(e.target.value)}
                    placeholder="85"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Letterboxd (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={letterboxdRating}
                    onChange={(e) => setLetterboxdRating(e.target.value)}
                    placeholder="3.8"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Streaming Sources Tab */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Existing sources list */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div
                      key={index}
                      className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3"
                    >
                      {editingSourceIndex === index ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={source.name}
                              onChange={(e) =>
                                handleUpdateSource(index, { ...source, name: e.target.value })
                              }
                              placeholder="Service name"
                              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                            />
                            <select
                              value={source.type}
                              onChange={(e) =>
                                handleUpdateSource(index, {
                                  ...source,
                                  type: e.target.value as StreamingSource['type'],
                                })
                              }
                              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                            >
                              <option value="subscription">Subscription</option>
                              <option value="free">Free</option>
                              <option value="rent">Rent</option>
                              <option value="buy">Buy</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={source.url}
                            onChange={(e) =>
                              handleUpdateSource(index, { ...source, url: e.target.value })
                            }
                            placeholder="Deep link URL"
                            className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={source.region}
                              onChange={(e) =>
                                handleUpdateSource(index, { ...source, region: e.target.value })
                              }
                              placeholder="Region"
                              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                            />
                            <input
                              type="text"
                              value={source.price || ''}
                              onChange={(e) =>
                                handleUpdateSource(index, { ...source, price: e.target.value })
                              }
                              placeholder="Price"
                              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                            />
                            <input
                              type="text"
                              value={source.quality || ''}
                              onChange={(e) =>
                                handleUpdateSource(index, { ...source, quality: e.target.value })
                              }
                              placeholder="Quality"
                              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => setEditingSourceIndex(null)}
                              className="px-3 py-1 text-sm text-purple-400 hover:text-purple-300"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{source.name}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  source.type === 'subscription'
                                    ? 'bg-purple-600/20 text-purple-400'
                                    : source.type === 'free'
                                    ? 'bg-green-600/20 text-green-400'
                                    : source.type === 'rent'
                                    ? 'bg-yellow-600/20 text-yellow-400'
                                    : 'bg-blue-600/20 text-blue-400'
                                }`}
                              >
                                {source.type}
                              </span>
                              {source.price && (
                                <span className="text-xs text-gray-500">{source.price}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-[300px]">
                              {source.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSourceIndex(index)}
                              className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSource(index)}
                              className="p-1.5 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new source */}
              {showAddSource ? (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-white">Add New Source</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Service Name *</label>
                      <input
                        type="text"
                        value={newSource.name}
                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                        placeholder="Netflix, Shudder, etc."
                        className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        value={newSource.type}
                        onChange={(e) =>
                          setNewSource({
                            ...newSource,
                            type: e.target.value as StreamingSource['type'],
                          })
                        }
                        className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                      >
                        <option value="subscription">Subscription</option>
                        <option value="free">Free</option>
                        <option value="rent">Rent</option>
                        <option value="buy">Buy</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Deep Link URL *</label>
                    <input
                      type="text"
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      placeholder="https://www.netflix.com/title/..."
                      className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Region</label>
                      <input
                        type="text"
                        value={newSource.region}
                        onChange={(e) => setNewSource({ ...newSource, region: e.target.value })}
                        placeholder="US"
                        className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price</label>
                      <input
                        type="text"
                        value={newSource.price || ''}
                        onChange={(e) => setNewSource({ ...newSource, price: e.target.value })}
                        placeholder="$3.99"
                        className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quality</label>
                      <input
                        type="text"
                        value={newSource.quality || ''}
                        onChange={(e) => setNewSource({ ...newSource, quality: e.target.value })}
                        placeholder="HD, 4K"
                        className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddSource(false)}
                      className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSource}
                      disabled={!newSource.name || !newSource.url}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Source
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSource(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Streaming Source
                </button>
              )}

              {sources.length === 0 && !showAddSource && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No streaming sources yet. Click &quot;Add Streaming Source&quot; to add one.
                </p>
              )}
            </div>
          )}
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
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================
export default function AdminTitlesPage() {
  const [titles, setTitles] = useState<Title[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'not-featured'>('all')
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [enrichingId, setEnrichingId] = useState<string | null>(null)

  // Fetch titles from Supabase (handles pagination to get all titles)
  const fetchTitles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const allTitles: Title[] = []
      const pageSize = 1000
      let page = 0
      let hasMore = true

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error: fetchError } = await supabase
          .from('availability_cards')
          .select('*')
          .order('updated_at', { ascending: false })
          .range(from, to)

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          allTitles.push(...data.map(mapDbRowToTitle))
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }

      setTitles(allTitles)
    } catch (err) {
      console.error('Error fetching titles:', err)
      setError('Failed to load titles. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load titles on mount
  useEffect(() => {
    fetchTitles()
  }, [fetchTitles])

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [enrichModalOpen, setEnrichModalOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null)

  // Filter titles
  const filteredTitles = titles.filter((title) => {
    const matchesSearch =
      title.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.imdb_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFeatured =
      filterFeatured === 'all' ||
      (filterFeatured === 'featured' && title.featured) ||
      (filterFeatured === 'not-featured' && !title.featured)
    return matchesSearch && matchesFeatured
  })

  // Handlers
  const handleAddTitle = async (newTitle: Title) => {
    // Optimistically add to state, then refetch
    setTitles([newTitle, ...titles])
    // Refetch to get the actual database state
    await fetchTitles()
  }

  const handleEditTitle = async (updatedTitle: Title) => {
    try {
      const response = await fetch('/api/admin/manual-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedTitle.id,
          subgenres: updatedTitle.subgenres,
          editorial_tags: updatedTitle.editorial_tags,
          featured: updatedTitle.featured,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update')
      }

      setTitles(titles.map((t) => (t.id === updatedTitle.id ? updatedTitle : t)))
    } catch (err) {
      console.error('Error updating title:', err)
      alert('Failed to update title. Please try again.')
    }
  }

  const handleDeleteTitle = async () => {
    if (selectedTitle) {
      try {
        console.log('Attempting to delete title:', selectedTitle.id, selectedTitle.title)

        const response = await fetch('/api/admin/delete-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedTitle.id }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete')
        }

        console.log('Delete successful:', data.deleted_title)
        setTitles(titles.filter((t) => t.id !== selectedTitle.id))
        alert(`Successfully deleted "${selectedTitle.title}"`)
      } catch (err) {
        console.error('Error deleting title:', err)
        alert(`Failed to delete title: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleToggleFeatured = async (titleId: string) => {
    const title = titles.find((t) => t.id === titleId)
    if (!title) return

    const newFeatured = !title.featured

    // Optimistic update
    setTitles(
      titles.map((t) =>
        t.id === titleId ? { ...t, featured: newFeatured } : t
      )
    )

    try {
      const response = await fetch('/api/admin/manual-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: titleId, featured: newFeatured }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }
    } catch (err) {
      console.error('Error toggling featured:', err)
      // Revert optimistic update
      setTitles(
        titles.map((t) =>
          t.id === titleId ? { ...t, featured: !newFeatured } : t
        )
      )
    }
  }

  const handleRefreshAvailability = async (titleId: string) => {
    setRefreshingId(titleId)
    try {
      const response = await fetch('/api/admin/refresh-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: titleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Refresh error:', data.error)
        alert(data.error || 'Failed to refresh availability')
        return
      }

      // Refetch to get updated data
      await fetchTitles()
    } catch (err) {
      console.error('Error refreshing availability:', err)
      alert('Failed to refresh availability. Please try again.')
    } finally {
      setRefreshingId(null)
    }
  }

  const handleEnrichTitle = async (titleId: string) => {
    setEnrichingId(titleId)
    try {
      const response = await fetch('/api/admin/enrich-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: titleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Enrich error:', data.error)
        alert(data.error || 'Failed to enrich title')
        return
      }

      // Show success with updated fields
      if (data.updated_fields?.length > 0) {
        alert(`Updated: ${data.updated_fields.join(', ')}`)
      } else {
        alert('No new data found to update')
      }

      // Refetch to get updated data
      await fetchTitles()
    } catch (err) {
      console.error('Error enriching title:', err)
      alert('Failed to enrich title. Please try again.')
    } finally {
      setEnrichingId(null)
    }
  }

  const handleImportComplete = async (results: ImportResult[]) => {
    // Refetch titles from database after import
    console.log('Import completed:', results)
    await fetchTitles()
  }

  const handleOpenEnrichModal = async (title: Title) => {
    // Fetch full record from Supabase to get all fields
    const { data } = await supabase
      .from('availability_cards')
      .select('*')
      .eq('id', title.id)
      .single()

    setSelectedTitle(data ? mapDbRowToTitle(data) : title)
    setEnrichModalOpen(true)
  }

  const handleManualEnrichSave = async (updates: Partial<Title> & { id: string }) => {
    try {
      const response = await fetch('/api/admin/manual-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      // Update local state with the returned data
      const { id } = updates
      setTitles(
        titles.map((t) =>
          t.id === id ? { ...t, ...data.data } : t
        )
      )

      setEnrichModalOpen(false)
      setSelectedTitle(null)
      alert('Title updated successfully!')
    } catch (err) {
      console.error('Error saving manual enrichment:', err)
      alert(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Titles</h1>
          <p className="text-gray-500">Manage your movie and series catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Title
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">{titles.length}</p>
          <p className="text-sm text-gray-500">Total Titles</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">
            {titles.filter((t) => t.featured).length}
          </p>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">
            {titles.reduce((acc, t) => acc + getSourcesCount(t), 0)}
          </p>
          <p className="text-sm text-gray-500">Total Sources</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white">
            {titles.length > 0 ? Math.round(titles.reduce((acc, t) => acc + getSourcesCount(t), 0) / titles.length * 10) / 10 : 0}
          </p>
          <p className="text-sm text-gray-500">Avg Sources/Title</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="ml-3 text-gray-400">Loading titles...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 flex-1">{error}</p>
          <button
            onClick={fetchTitles}
            className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-500 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      {!isLoading && !error && (
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title or IMDB ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-lg
              bg-[#1a1a1a] border border-gray-800 text-white
              placeholder:text-gray-600
              focus:outline-none focus:border-purple-500
            "
          />
        </div>

        <select
          value={filterFeatured}
          onChange={(e) => setFilterFeatured(e.target.value as typeof filterFeatured)}
          className="px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
        >
          <option value="all">All Titles</option>
          <option value="featured">Featured Only</option>
          <option value="not-featured">Not Featured</option>
        </select>
      </div>
      )}

      {/* Titles table */}
      {!isLoading && !error && (
      <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Poster</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Year</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">IMDB ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Sources</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Featured</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTitles.map((title) => (
                <tr
                  key={title.id}
                  className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="p-4">
                    <div className="w-12 h-16 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                      {title.poster_url ? (
                        <img
                          key={title.poster_url}
                          src={title.poster_url}
                          alt={title.title}
                          width={48}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <Film className={`w-6 h-6 text-gray-600 ${title.poster_url ? 'hidden' : ''}`} />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-white">{title.title}</p>
                    <div className="flex gap-1 mt-1">
                      {title.subgenres.slice(0, 2).map((subgenre) => (
                        <span
                          key={subgenre}
                          className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
                        >
                          {subgenre}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{title.year}</td>
                  <td className="p-4">
                    <a
                      href={`https://www.imdb.com/title/${title.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      {title.imdb_id}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-sm">
                      {getSourcesCount(title)}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeatured(title.id)}
                      className={`p-1.5 rounded transition-colors ${
                        title.featured
                          ? 'text-yellow-500 hover:bg-yellow-500/20'
                          : 'text-gray-600 hover:bg-gray-800 hover:text-gray-400'
                      }`}
                    >
                      {title.featured ? (
                        <Star className="w-5 h-5 fill-current" />
                      ) : (
                        <StarOff className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedTitle(title)
                          setEditModalOpen(true)
                        }}
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEnrichModal(title)}
                        className="p-1.5 rounded hover:bg-purple-600/20 text-gray-400 hover:text-purple-400 transition-colors"
                        title="Manual Enrich"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEnrichTitle(title.id)}
                        disabled={enrichingId === title.id}
                        className="p-1.5 rounded hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                        title="Auto Enrich (OMDB)"
                      >
                        <Download
                          className={`w-4 h-4 ${enrichingId === title.id ? 'animate-pulse' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handleRefreshAvailability(title.id)}
                        disabled={refreshingId === title.id}
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Refresh availability (Watchmode)"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${refreshingId === title.id ? 'animate-spin' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTitle(title)
                          setDeleteModalOpen(true)
                        }}
                        className="p-1.5 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTitles.length === 0 && (
          <div className="p-12 text-center">
            <Film className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No titles found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'Add your first title to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Showing {filteredTitles.length} of {titles.length} titles
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded bg-purple-600 text-white text-sm">1</button>
            <button className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">
              Next
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      <AddTitleModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddTitle}
      />

      <EditTitleModal
        isOpen={editModalOpen}
        title={selectedTitle}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedTitle(null)
        }}
        onSave={handleEditTitle}
      />

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onComplete={handleImportComplete}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={selectedTitle}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedTitle(null)
        }}
        onConfirm={handleDeleteTitle}
      />

      <ManualEnrichModal
        isOpen={enrichModalOpen}
        title={selectedTitle}
        onClose={() => {
          setEnrichModalOpen(false)
          setSelectedTitle(null)
        }}
        onSave={handleManualEnrichSave}
      />
    </div>
  )
}
