'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Upload,
  Download,
  Calendar,
  Clock,
  Tv,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Eye,
  SkipForward,
  RefreshCw,
} from 'lucide-react'
import {
  format,
  addDays,
  subDays,
  startOfDay,
  parseISO,
  isWithinInterval,
  areIntervalsOverlapping,
  setHours,
  setMinutes,
} from 'date-fns'
import Papa from 'papaparse'

// Types
interface EPGEntry {
  id: string
  channel: string
  title: string
  imdb_id?: string
  synopsis?: string
  start_time: string
  end_time: string
  is_genre_highlight: boolean
}

interface ImportRow {
  channel_name: string
  start_time: string
  end_time: string
  title: string
  imdb_id?: string
  synopsis?: string
  is_horror: string | boolean
}

interface ParsedEntry {
  row: ImportRow
  entry: Omit<EPGEntry, 'id'>
  isValid: boolean
  errors: string[]
  hasConflict: boolean
  conflictWith?: EPGEntry
}

interface TitleSuggestion {
  imdb_id: string
  title: string
  year: number
  poster?: string
}

// Mock data
const MOCK_CHANNELS = [
  { id: 'shudder', name: 'Shudder', color: '#e50914' },
  { id: 'amc', name: 'AMC', color: '#00a0df' },
  { id: 'syfy', name: 'Syfy', color: '#9b59b6' },
  { id: 'tcm', name: 'TCM', color: '#c0a062' },
  { id: 'cinemax', name: 'Cinemax', color: '#1a1a2e' },
]

const MOCK_SCHEDULE: EPGEntry[] = [
  {
    id: '1',
    channel: 'Shudder',
    title: 'A Nightmare on Elm Street',
    imdb_id: 'tt0087800',
    start_time: '2024-01-15T20:00:00',
    end_time: '2024-01-15T22:00:00',
    is_genre_highlight: true,
  },
  {
    id: '2',
    channel: 'Shudder',
    title: 'A Nightmare on Elm Street 2',
    imdb_id: 'tt0089686',
    start_time: '2024-01-15T22:00:00',
    end_time: '2024-01-16T00:00:00',
    is_genre_highlight: true,
  },
  {
    id: '3',
    channel: 'AMC',
    title: 'The Walking Dead',
    imdb_id: 'tt1520211',
    start_time: '2024-01-15T21:00:00',
    end_time: '2024-01-15T22:00:00',
    is_genre_highlight: false,
  },
  {
    id: '4',
    channel: 'Syfy',
    title: 'Alien',
    imdb_id: 'tt0078748',
    start_time: '2024-01-15T20:00:00',
    end_time: '2024-01-15T22:30:00',
    is_genre_highlight: true,
  },
  {
    id: '5',
    channel: 'TCM',
    title: 'Psycho',
    imdb_id: 'tt0054215',
    start_time: '2024-01-15T22:00:00',
    end_time: '2024-01-16T00:00:00',
    is_genre_highlight: true,
  },
  {
    id: '6',
    channel: 'Cinemax',
    title: 'The Exorcist',
    imdb_id: 'tt0070047',
    start_time: '2024-01-15T21:00:00',
    end_time: '2024-01-15T23:15:00',
    is_genre_highlight: true,
  },
]

// Mock title suggestions for autocomplete
const MOCK_TITLE_SUGGESTIONS: TitleSuggestion[] = [
  { imdb_id: 'tt0087800', title: 'A Nightmare on Elm Street', year: 1984 },
  { imdb_id: 'tt0078748', title: 'Alien', year: 1979 },
  { imdb_id: 'tt0054215', title: 'Psycho', year: 1960 },
  { imdb_id: 'tt0070047', title: 'The Exorcist', year: 1973 },
  { imdb_id: 'tt0081505', title: 'The Shining', year: 1980 },
  { imdb_id: 'tt0077651', title: 'Halloween', year: 1978 },
  { imdb_id: 'tt0063350', title: 'Night of the Living Dead', year: 1968 },
  { imdb_id: 'tt0084516', title: 'Poltergeist', year: 1982 },
  { imdb_id: 'tt0075005', title: 'The Omen', year: 1976 },
  { imdb_id: 'tt0091419', title: 'The Fly', year: 1986 },
]

// Time slots for the grid (6 AM to 2 AM next day)
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = (i + 6) % 24
  return { hour, label: format(setHours(new Date(), hour), 'h a') }
})

/**
 * Calendar Grid View Component
 */
function CalendarGrid({
  schedule,
  selectedDate,
  onEditEntry,
  onDeleteEntry,
}: {
  schedule: EPGEntry[]
  selectedDate: Date
  onEditEntry: (entry: EPGEntry) => void
  onDeleteEntry: (entry: EPGEntry) => void
}) {
  const dayStart = startOfDay(selectedDate)
  const dayEnd = addDays(dayStart, 1)

  // Filter schedule for selected date
  const daySchedule = schedule.filter((entry) => {
    const entryStart = parseISO(entry.start_time)
    const entryEnd = parseISO(entry.end_time)
    return (
      isWithinInterval(entryStart, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(entryEnd, { start: dayStart, end: dayEnd }) ||
      (entryStart < dayStart && entryEnd > dayEnd)
    )
  })

  // Calculate position and width for entry
  const getEntryStyle = (entry: EPGEntry) => {
    const entryStart = parseISO(entry.start_time)
    const entryEnd = parseISO(entry.end_time)

    // Convert to hours from 6 AM
    const gridStartHour = 6
    const startHour = entryStart.getHours() + entryStart.getMinutes() / 60
    const endHour = entryEnd.getHours() + entryEnd.getMinutes() / 60

    // Handle overnight entries
    let adjustedStart = startHour - gridStartHour
    let adjustedEnd = endHour - gridStartHour

    if (adjustedStart < 0) adjustedStart += 24
    if (adjustedEnd <= 0) adjustedEnd += 24
    if (adjustedEnd < adjustedStart) adjustedEnd = 20 // Cap at 2 AM

    const left = Math.max(0, (adjustedStart / 20) * 100)
    const width = Math.min(100 - left, ((adjustedEnd - Math.max(0, adjustedStart)) / 20) * 100)

    return { left: `${left}%`, width: `${Math.max(width, 5)}%` }
  }

  const getChannelColor = (channelName: string) => {
    const channel = MOCK_CHANNELS.find((c) => c.name === channelName)
    return channel?.color || '#6b7280'
  }

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
      {/* Time header */}
      <div className="flex border-b border-gray-800">
        <div className="w-24 flex-shrink-0 p-2 bg-[#0a0a0a]" />
        <div className="flex-1 flex">
          {TIME_SLOTS.map((slot, index) => (
            <div
              key={index}
              className="flex-1 p-2 text-xs text-gray-500 text-center border-l border-gray-800/50"
            >
              {slot.label}
            </div>
          ))}
        </div>
      </div>

      {/* Channel rows */}
      {MOCK_CHANNELS.map((channel) => {
        const channelEntries = daySchedule.filter((e) => e.channel === channel.name)
        return (
          <div key={channel.id} className="flex border-b border-gray-800/50 min-h-[60px]">
            <div className="w-24 flex-shrink-0 p-2 bg-[#0a0a0a] flex items-center">
              <span
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ backgroundColor: `${channel.color}30`, color: channel.color }}
              >
                {channel.name}
              </span>
            </div>
            <div className="flex-1 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {TIME_SLOTS.map((_, index) => (
                  <div key={index} className="flex-1 border-l border-gray-800/30" />
                ))}
              </div>

              {/* Entries */}
              {channelEntries.map((entry) => {
                const style = getEntryStyle(entry)
                return (
                  <div
                    key={entry.id}
                    className="absolute top-1 bottom-1 rounded px-2 py-1 cursor-pointer group overflow-hidden"
                    style={{
                      ...style,
                      backgroundColor: entry.is_genre_highlight
                        ? 'rgba(147, 51, 234, 0.3)'
                        : 'rgba(55, 65, 81, 0.5)',
                      borderLeft: `3px solid ${getChannelColor(entry.channel)}`,
                    }}
                    onClick={() => onEditEntry(entry)}
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{entry.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {format(parseISO(entry.start_time), 'h:mm a')} - {format(parseISO(entry.end_time), 'h:mm a')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteEntry(entry)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/30 rounded transition-opacity"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                    {entry.is_genre_highlight && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-bl" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 bg-[#0a0a0a] border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded bg-purple-600/30 border-l-2 border-purple-500" />
          <span>Genre Highlight</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded bg-gray-700/50 border-l-2 border-gray-500" />
          <span>Regular Programming</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Title Autocomplete Component
 */
function TitleAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: TitleSuggestion) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    // Simulate API call
    const timer = setTimeout(() => {
      const filtered = MOCK_TITLE_SUGGESTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(value.toLowerCase()) ||
          s.imdb_id.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search by title or IMDB ID..."
        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.imdb_id}
              onClick={() => {
                onSelect(suggestion)
                onChange(suggestion.title)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{suggestion.title}</p>
                <p className="text-xs text-gray-500">
                  {suggestion.year} • {suggestion.imdb_id}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Add/Edit Entry Modal
 */
function EntryModal({
  isOpen,
  onClose,
  entry,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  entry: EPGEntry | null
  onSave: (entry: Omit<EPGEntry, 'id'> & { id?: string }) => void
}) {
  const [formData, setFormData] = useState({
    channel: '',
    title: '',
    imdb_id: '',
    synopsis: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '20:00',
    end_time: '22:00',
    is_genre_highlight: true,
  })

  useEffect(() => {
    if (entry) {
      const startDate = parseISO(entry.start_time)
      const endDate = parseISO(entry.end_time)
      setFormData({
        channel: entry.channel,
        title: entry.title,
        imdb_id: entry.imdb_id || '',
        synopsis: entry.synopsis || '',
        date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        end_time: format(endDate, 'HH:mm'),
        is_genre_highlight: entry.is_genre_highlight,
      })
    } else {
      setFormData({
        channel: MOCK_CHANNELS[0].name,
        title: '',
        imdb_id: '',
        synopsis: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '20:00',
        end_time: '22:00',
        is_genre_highlight: true,
      })
    }
  }, [entry, isOpen])

  const handleSubmit = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number)
    const [endHour, endMin] = formData.end_time.split(':').map(Number)

    let startDateTime = setMinutes(setHours(parseISO(formData.date), startHour), startMin)
    let endDateTime = setMinutes(setHours(parseISO(formData.date), endHour), endMin)

    // Handle overnight (end time before start time)
    if (endDateTime <= startDateTime) {
      endDateTime = addDays(endDateTime, 1)
    }

    onSave({
      ...(entry?.id && { id: entry.id }),
      channel: formData.channel,
      title: formData.title,
      imdb_id: formData.imdb_id || undefined,
      synopsis: formData.synopsis || undefined,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_genre_highlight: formData.is_genre_highlight,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#141414] px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {entry ? 'Edit Entry' : 'Add Entry'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Channel */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Channel</label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            >
              {MOCK_CHANNELS.map((channel) => (
                <option key={channel.id} value={channel.name}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title with Autocomplete */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <TitleAutocomplete
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
              onSelect={(suggestion) =>
                setFormData({
                  ...formData,
                  title: suggestion.title,
                  imdb_id: suggestion.imdb_id,
                })
              }
            />
          </div>

          {/* IMDB ID */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">IMDB ID</label>
            <input
              type="text"
              value={formData.imdb_id}
              onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
              placeholder="tt0000000"
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder:text-gray-600"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Synopsis (Optional)</label>
            <textarea
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder:text-gray-600 resize-none"
              placeholder="Brief description..."
            />
          </div>

          {/* Genre Highlight */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_genre_highlight}
              onChange={(e) => setFormData({ ...formData, is_genre_highlight: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-[#1a1a1a] text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Mark as Genre Highlight</span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-[#141414] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.channel || !formData.title}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {entry ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Import Modal
 */
function ImportModal({
  isOpen,
  onClose,
  existingSchedule,
  onImport,
}: {
  isOpen: boolean
  onClose: () => void
  existingSchedule: EPGEntry[]
  onImport: (entries: Omit<EPGEntry, 'id'>[]) => void
}) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([])
  const [conflictAction, setConflictAction] = useState<'skip' | 'overwrite'>('skip')
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    skipped: number
    errors: number
  }>({ success: 0, skipped: 0, errors: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetModal = () => {
    setStep('upload')
    setParsedEntries([])
    setConflictAction('skip')
    setImportProgress(0)
    setImportResults({ success: 0, skipped: 0, errors: 0 })
  }

  useEffect(() => {
    if (!isOpen) {
      resetModal()
    }
  }, [isOpen])

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const entries: ParsedEntry[] = (results.data as ImportRow[]).map((row) => {
          const errors: string[] = []

          // Validate required fields
          if (!row.channel_name) errors.push('Missing channel name')
          if (!row.start_time) errors.push('Missing start time')
          if (!row.end_time) errors.push('Missing end time')
          if (!row.title) errors.push('Missing title')

          // Validate channel exists
          const channelExists = MOCK_CHANNELS.some(
            (c) => c.name.toLowerCase() === row.channel_name?.toLowerCase()
          )
          if (row.channel_name && !channelExists) {
            errors.push(`Unknown channel: ${row.channel_name}`)
          }

          // Parse dates
          let startTime: Date | null = null
          let endTime: Date | null = null

          try {
            startTime = new Date(row.start_time)
            if (isNaN(startTime.getTime())) {
              errors.push('Invalid start time format')
              startTime = null
            }
          } catch {
            errors.push('Invalid start time format')
          }

          try {
            endTime = new Date(row.end_time)
            if (isNaN(endTime.getTime())) {
              errors.push('Invalid end time format')
              endTime = null
            }
          } catch {
            errors.push('Invalid end time format')
          }

          // Check for conflicts
          let hasConflict = false
          let conflictWith: EPGEntry | undefined

          if (startTime && endTime && channelExists) {
            const matchingChannel = MOCK_CHANNELS.find(
              (c) => c.name.toLowerCase() === row.channel_name.toLowerCase()
            )

            for (const existing of existingSchedule) {
              if (existing.channel.toLowerCase() === matchingChannel?.name.toLowerCase()) {
                const existingStart = parseISO(existing.start_time)
                const existingEnd = parseISO(existing.end_time)

                if (
                  areIntervalsOverlapping(
                    { start: startTime, end: endTime },
                    { start: existingStart, end: existingEnd }
                  )
                ) {
                  hasConflict = true
                  conflictWith = existing
                  break
                }
              }
            }
          }

          const isHorror =
            row.is_horror === true ||
            row.is_horror === 'true' ||
            row.is_horror === '1' ||
            row.is_horror === 'yes'

          const entry: Omit<EPGEntry, 'id'> = {
            channel:
              MOCK_CHANNELS.find((c) => c.name.toLowerCase() === row.channel_name?.toLowerCase())
                ?.name || row.channel_name,
            title: row.title || '',
            imdb_id: row.imdb_id || undefined,
            synopsis: row.synopsis || undefined,
            start_time: startTime?.toISOString() || '',
            end_time: endTime?.toISOString() || '',
            is_genre_highlight: isHorror,
          }

          return {
            row,
            entry,
            isValid: errors.length === 0,
            errors,
            hasConflict,
            conflictWith,
          }
        })

        setParsedEntries(entries)
        setStep('preview')
      },
      error: (error) => {
        console.error('Parse error:', error)
        alert('Failed to parse file. Please check the format.')
      },
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      parseFile(file)
    }
  }

  const handleImport = async () => {
    setStep('importing')

    const entriesToImport = parsedEntries.filter((p) => {
      if (!p.isValid) return false
      if (p.hasConflict && conflictAction === 'skip') return false
      return true
    })

    let success = 0
    let skipped = 0
    let errors = 0

    // Simulate batch import
    for (let i = 0; i < entriesToImport.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))

      const entry = entriesToImport[i]
      if (entry.isValid) {
        success++
      } else {
        errors++
      }

      setImportProgress(((i + 1) / entriesToImport.length) * 100)
    }

    skipped = parsedEntries.filter((p) => !p.isValid || (p.hasConflict && conflictAction === 'skip')).length

    setImportResults({ success, skipped, errors })
    setStep('complete')

    // Actually perform the import
    const validEntries = entriesToImport.map((p) => p.entry)
    onImport(validEntries)
  }

  const stats = useMemo(() => {
    const valid = parsedEntries.filter((p) => p.isValid).length
    const invalid = parsedEntries.filter((p) => !p.isValid).length
    const conflicts = parsedEntries.filter((p) => p.hasConflict).length
    return { total: parsedEntries.length, valid, invalid, conflicts }
  }, [parsedEntries])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-white">Import Schedule</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-purple-500/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  Drag and drop your CSV file here, or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Expected format */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-2">Expected CSV Format:</h3>
                <code className="block text-xs text-gray-400 bg-[#0a0a0a] p-3 rounded overflow-x-auto">
                  channel_name,start_time,end_time,title,imdb_id,synopsis,is_horror
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  • <strong>channel_name:</strong> Shudder, AMC, Syfy, TCM, or Cinemax<br />
                  • <strong>start_time/end_time:</strong> ISO 8601 format (2024-01-15T20:00:00)<br />
                  • <strong>imdb_id:</strong> Optional, format ttXXXXXXX<br />
                  • <strong>is_horror:</strong> true/false, 1/0, or yes/no
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Rows</p>
                </div>
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-400">{stats.valid}</p>
                  <p className="text-xs text-gray-500">Valid</p>
                </div>
                <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-400">{stats.invalid}</p>
                  <p className="text-xs text-gray-500">Invalid</p>
                </div>
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-yellow-400">{stats.conflicts}</p>
                  <p className="text-xs text-gray-500">Conflicts</p>
                </div>
              </div>

              {/* Conflict handling */}
              {stats.conflicts > 0 && (
                <div className="flex items-center gap-4 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-200">
                      {stats.conflicts} entries conflict with existing schedule
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConflictAction('skip')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                        conflictAction === 'skip'
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                    <button
                      onClick={() => setConflictAction('overwrite')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                        conflictAction === 'overwrite'
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Overwrite
                    </button>
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a0a0a] sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-gray-500 font-medium">Status</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Channel</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Title</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Start</th>
                        <th className="text-left p-3 text-gray-500 font-medium">End</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Horror</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedEntries.map((parsed, index) => (
                        <tr
                          key={index}
                          className={`border-t border-gray-800/50 ${
                            !parsed.isValid
                              ? 'bg-red-600/5'
                              : parsed.hasConflict
                              ? 'bg-yellow-600/5'
                              : ''
                          }`}
                        >
                          <td className="p-3">
                            {!parsed.isValid ? (
                              <div className="flex items-center gap-1">
                                <X className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-400" title={parsed.errors.join(', ')}>
                                  Error
                                </span>
                              </div>
                            ) : parsed.hasConflict ? (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs text-yellow-400">Conflict</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400">Valid</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-gray-300">{parsed.row.channel_name}</td>
                          <td className="p-3 text-white">{parsed.row.title}</td>
                          <td className="p-3 text-gray-400 text-xs">
                            {parsed.entry.start_time
                              ? format(parseISO(parsed.entry.start_time), 'MMM d, h:mm a')
                              : '-'}
                          </td>
                          <td className="p-3 text-gray-400 text-xs">
                            {parsed.entry.end_time
                              ? format(parseISO(parsed.entry.end_time), 'MMM d, h:mm a')
                              : '-'}
                          </td>
                          <td className="p-3">
                            {parsed.entry.is_genre_highlight ? (
                              <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded">
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
              <p className="text-white mb-4">Importing schedule...</p>
              <div className="w-full max-w-xs mx-auto bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-200"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(importProgress)}%</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-6">Import Complete</h3>

              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <p className="text-3xl font-bold text-green-400">{importResults.success}</p>
                  <p className="text-sm text-gray-500">Imported</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-400">{importResults.skipped}</p>
                  <p className="text-sm text-gray-500">Skipped</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-400">{importResults.errors}</p>
                  <p className="text-sm text-gray-500">Errors</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-between flex-shrink-0">
          {step === 'preview' && (
            <button
              onClick={() => {
                setStep('upload')
                setParsedEntries([])
              }}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          {step === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={stats.valid === 0}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
              >
                Import {conflictAction === 'skip' ? stats.valid - stats.conflicts : stats.valid} Entries
              </button>
            </div>
          )}
          {step === 'complete' && (
            <button
              onClick={onClose}
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

/**
 * Delete Confirmation Modal
 */
function DeleteModal({
  isOpen,
  onClose,
  entry,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  entry: EPGEntry | null
  onConfirm: () => void
}) {
  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-gray-800 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Delete Entry</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-3 mb-6">
          <p className="text-white font-medium">{entry.title}</p>
          <p className="text-sm text-gray-500">
            {entry.channel} • {format(parseISO(entry.start_time), 'MMM d, h:mm a')}
          </p>
        </div>

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

/**
 * Admin EPG Management Page
 */
export default function AdminEPGPage() {
  const [schedule, setSchedule] = useState<EPGEntry[]>(MOCK_SCHEDULE)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Modal states
  const [entryModalOpen, setEntryModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<EPGEntry | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<EPGEntry | null>(null)

  // Navigate dates
  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1))
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  // Filter schedule for list view
  const filteredSchedule = schedule.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = selectedChannel === 'all' || item.channel === selectedChannel
    const itemDate = parseISO(item.start_time)
    const matchesDate = format(itemDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    return matchesSearch && matchesChannel && matchesDate
  })

  // Calculate stats
  const daySchedule = schedule.filter((item) => {
    const itemDate = parseISO(item.start_time)
    return format(itemDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  })
  const highlightCount = daySchedule.filter((i) => i.is_genre_highlight).length

  // Handlers
  const handleSaveEntry = (entry: Omit<EPGEntry, 'id'> & { id?: string }) => {
    if (entry.id) {
      // Update existing
      setSchedule((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, ...entry } as EPGEntry : e))
      )
    } else {
      // Add new
      const newEntry: EPGEntry = {
        ...entry,
        id: `new-${Date.now()}`,
      }
      setSchedule((prev) => [...prev, newEntry])
    }
  }

  const handleDeleteEntry = () => {
    if (deletingEntry) {
      setSchedule((prev) => prev.filter((e) => e.id !== deletingEntry.id))
    }
  }

  const handleImport = (entries: Omit<EPGEntry, 'id'>[]) => {
    const newEntries: EPGEntry[] = entries.map((e, i) => ({
      ...e,
      id: `import-${Date.now()}-${i}`,
    }))
    setSchedule((prev) => [...prev, ...newEntries])
  }

  const handleExport = () => {
    const csv = Papa.unparse(
      schedule.map((e) => ({
        channel_name: e.channel,
        start_time: e.start_time,
        end_time: e.end_time,
        title: e.title,
        imdb_id: e.imdb_id || '',
        synopsis: e.synopsis || '',
        is_horror: e.is_genre_highlight ? 'true' : 'false',
      }))
    )

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `epg-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">EPG Schedule</h1>
          <p className="text-gray-500">Manage TV guide programming schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              setEditingEntry(null)
              setEntryModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Date picker and navigation */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevDay}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(parseISO(e.target.value))}
              className="px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white"
            />
            <h3 className="font-semibold text-white text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{daySchedule.length}</p>
          <p className="text-xs text-gray-500">scheduled items</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Channels</span>
          </div>
          <p className="text-2xl font-bold text-white">{MOCK_CHANNELS.length}</p>
          <p className="text-xs text-gray-500">active channels</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Highlights</span>
          </div>
          <p className="text-2xl font-bold text-white">{highlightCount}</p>
          <p className="text-xs text-gray-500">genre highlights</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{schedule.length}</p>
          <p className="text-xs text-gray-500">entries in database</p>
        </div>
      </div>

      {/* View toggle content */}
      {viewMode === 'grid' ? (
        <CalendarGrid
          schedule={schedule}
          selectedDate={selectedDate}
          onEditEntry={(entry) => {
            setEditingEntry(entry)
            setEntryModalOpen(true)
          }}
          onDeleteEntry={(entry) => {
            setDeletingEntry(entry)
            setDeleteModalOpen(true)
          }}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search schedule..."
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
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
            >
              <option value="all">All Channels</option>
              {MOCK_CHANNELS.map((channel) => (
                <option key={channel.id} value={channel.name}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule table */}
          <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Channel</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Title</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">IMDB</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Time</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedule.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded text-sm"
                          style={{
                            backgroundColor: `${
                              MOCK_CHANNELS.find((c) => c.name === item.channel)?.color || '#666'
                            }30`,
                            color: MOCK_CHANNELS.find((c) => c.name === item.channel)?.color || '#666',
                          }}
                        >
                          {item.channel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{item.title}</span>
                          {item.is_genre_highlight && (
                            <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded">
                              Highlight
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {item.imdb_id ? (
                          <a
                            href={`https://www.imdb.com/title/${item.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-400 hover:underline"
                          >
                            {item.imdb_id}
                          </a>
                        ) : (
                          <span className="text-gray-600 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">
                        {format(parseISO(item.start_time), 'h:mm a')} -{' '}
                        {format(parseISO(item.end_time), 'h:mm a')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingEntry(item)
                              setEntryModalOpen(true)
                            }}
                            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingEntry(item)
                              setDeleteModalOpen(true)
                            }}
                            className="p-1.5 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
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

            {filteredSchedule.length === 0 && (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No schedule items</h3>
                <p className="text-sm text-gray-600">
                  No entries for this date. Import a schedule or add entries manually.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <EntryModal
        isOpen={entryModalOpen}
        onClose={() => {
          setEntryModalOpen(false)
          setEditingEntry(null)
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        existingSchedule={schedule}
        onImport={handleImport}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeletingEntry(null)
        }}
        entry={deletingEntry}
        onConfirm={handleDeleteEntry}
      />
    </div>
  )
}
