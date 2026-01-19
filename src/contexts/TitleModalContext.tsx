'use client'

import { createContext, useContext, useState, useCallback, ReactNode, lazy, Suspense } from 'react'
import type { AvailabilityCard } from '@/types'

// Lazy load the modal - it's not needed on initial page load
const TitleDetailModal = lazy(() => import('@/components/TitleDetailModal'))

interface TitleModalContextType {
  openModal: (card: AvailabilityCard, isEPGItem?: boolean) => void
  closeModal: () => void
  isOpen: boolean
  currentCard: AvailabilityCard | null
}

const TitleModalContext = createContext<TitleModalContextType | undefined>(undefined)

/**
 * Provider for the Title Detail Modal context
 *
 * Wrap your app with this provider to enable the modal
 * to be opened from any component.
 */
export function TitleModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentCard, setCurrentCard] = useState<AvailabilityCard | null>(null)
  const [isEPGItem, setIsEPGItem] = useState(false)

  const openModal = useCallback((card: AvailabilityCard, epgItem = false) => {
    setCurrentCard(card)
    setIsEPGItem(epgItem)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Delay clearing the card to allow close animation
    setTimeout(() => {
      setCurrentCard(null)
      setIsEPGItem(false)
    }, 300)
  }, [])

  return (
    <TitleModalContext.Provider value={{ openModal, closeModal, isOpen, currentCard }}>
      {children}
      {/* Only render modal when needed - lazy loaded */}
      {(isOpen || currentCard) && (
        <Suspense fallback={null}>
          <TitleDetailModal
            card={currentCard}
            isOpen={isOpen}
            onClose={closeModal}
            isEPGItem={isEPGItem}
          />
        </Suspense>
      )}
    </TitleModalContext.Provider>
  )
}

/**
 * Hook to access the title modal context
 *
 * @example
 * const { openModal } = useTitleModal()
 * openModal(card) // Opens the modal with the given card
 * openModal(card, true) // Opens with EPG-specific features
 */
export function useTitleModal() {
  const context = useContext(TitleModalContext)
  if (context === undefined) {
    throw new Error('useTitleModal must be used within a TitleModalProvider')
  }
  return context
}
