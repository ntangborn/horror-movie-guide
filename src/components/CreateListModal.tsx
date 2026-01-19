'use client'

import { useState } from 'react'
import {
  X,
  Plus,
  Copy,
  Search,
  List,
  Sparkles,
  ChevronRight,
  Film,
} from 'lucide-react'
import type { CuratedList } from '@/types'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateEmpty: (name: string, description: string) => void
  onCreateFromList: (sourceList: CuratedList) => void
  onCreateFromSearch: () => void
  availableLists?: CuratedList[]
}

type ModalStep = 'choose' | 'empty' | 'from-list'

/**
 * Option card component
 */
function OptionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full p-4 rounded-xl bg-[#1a1a1a] border border-gray-800
        hover:border-purple-500/50 hover:bg-[#1f1f1f]
        transition-all duration-200 text-left group
      "
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600/30 transition-colors">
          <Icon className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}

/**
 * Create List Modal
 *
 * Multi-step modal for creating new binge lists
 */
export function CreateListModal({
  isOpen,
  onClose,
  onCreateEmpty,
  onCreateFromList,
  onCreateFromSearch,
  availableLists = [],
}: CreateListModalProps) {
  const [step, setStep] = useState<ModalStep>('choose')
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [selectedSourceList, setSelectedSourceList] = useState<CuratedList | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    setStep('choose')
    setListName('')
    setListDescription('')
    setSelectedSourceList(null)
    onClose()
  }

  const handleCreateEmpty = () => {
    if (listName.trim()) {
      onCreateEmpty(listName.trim(), listDescription.trim())
      handleClose()
    }
  }

  const handleSelectSourceList = (list: CuratedList) => {
    setSelectedSourceList(list)
    setListName(`${list.title} (Copy)`)
    setListDescription(list.description)
  }

  const handleCreateFromList = () => {
    if (selectedSourceList && listName.trim()) {
      onCreateFromList(selectedSourceList)
      handleClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0f0f0f] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {step === 'choose' && 'Create New List'}
                {step === 'empty' && 'New Empty List'}
                {step === 'from-list' && 'Copy Existing List'}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 'choose' && 'Choose how to start'}
                {step === 'empty' && 'Start from scratch'}
                {step === 'from-list' && 'Select a list to copy'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Choose creation method */}
          {step === 'choose' && (
            <div className="space-y-3">
              <OptionCard
                icon={List}
                title="Create Empty List"
                description="Start with a blank list and add titles manually"
                onClick={() => setStep('empty')}
              />

              <OptionCard
                icon={Copy}
                title="Copy Existing List"
                description="Start from a curated list and customize it"
                onClick={() => setStep('from-list')}
              />

              <OptionCard
                icon={Search}
                title="Create from Search"
                description="Search for titles and add them to a new list"
                onClick={() => {
                  handleClose()
                  onCreateFromSearch()
                }}
              />

              <OptionCard
                icon={Sparkles}
                title="AI Recommendations"
                description="Get personalized suggestions based on your taste"
                onClick={() => {
                  // TODO: Implement AI recommendations
                  alert('Coming soon!')
                }}
              />
            </div>
          )}

          {/* Step: Create empty list */}
          {step === 'empty' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="My Horror Marathon"
                  className="
                    w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800
                    text-white placeholder-gray-600
                    focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                    transition-colors
                  "
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="What's this list about?"
                  rows={3}
                  className="
                    w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800
                    text-white placeholder-gray-600
                    focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                    transition-colors resize-none
                  "
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:bg-[#252525] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateEmpty}
                  disabled={!listName.trim()}
                  className="
                    flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium
                    hover:bg-purple-500 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Create List
                </button>
              </div>
            </div>
          )}

          {/* Step: Copy from existing list */}
          {step === 'from-list' && (
            <div className="space-y-4">
              {/* List selection */}
              {!selectedSourceList && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableLists.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No lists available to copy</p>
                    </div>
                  ) : (
                    availableLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleSelectSourceList(list)}
                        className="
                          w-full p-3 rounded-lg bg-[#1a1a1a] border border-gray-800
                          hover:border-purple-500/50 transition-colors text-left
                        "
                      >
                        <div className="font-medium text-white">{list.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {list.cards.length} titles &middot; by {list.author}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Edit copied list name */}
              {selectedSourceList && (
                <>
                  <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-500/30">
                    <div className="text-sm text-purple-300">
                      Copying from: <span className="font-medium">{selectedSourceList.title}</span>
                    </div>
                    <div className="text-xs text-purple-400/60 mt-1">
                      {selectedSourceList.cards.length} titles will be added
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New List Name
                    </label>
                    <input
                      type="text"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      className="
                        w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800
                        text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                        transition-colors
                      "
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (selectedSourceList) {
                      setSelectedSourceList(null)
                      setListName('')
                    } else {
                      setStep('choose')
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:bg-[#252525] transition-colors"
                >
                  Back
                </button>
                {selectedSourceList && (
                  <button
                    onClick={handleCreateFromList}
                    disabled={!listName.trim()}
                    className="
                      flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium
                      hover:bg-purple-500 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Create Copy
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateListModal
