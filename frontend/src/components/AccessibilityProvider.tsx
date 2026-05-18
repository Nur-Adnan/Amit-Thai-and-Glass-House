'use client'

import React, { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { language, t } = useLanguage()

  useEffect(() => {
    // Set document language
    document.documentElement.lang = language === 'bn' ? 'bn-BD' : 'en-US'

    // Add keyboard navigation detection
    let isUsingKeyboard = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true
        document.body.classList.add('keyboard-nav-visible')
      }
    }

    const handleMouseDown = () => {
      isUsingKeyboard = false
      document.body.classList.remove('keyboard-nav-visible')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [language])

  return (
    <>
      <a
        href="#main-content"
        className="skip-to-content"
        aria-label={t('a11ySkipToContent')}
      >
        {t('a11ySkipToContent')}
      </a>

      {/* ARIA live region for announcements */}
      <div
        id="aria-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      ></div>

      {children}
    </>
  )
}

// Helper function to announce messages to screen readers
export function announceToScreenReader(message: string) {
  const liveRegion = document.getElementById('aria-live-region')
  if (liveRegion) {
    liveRegion.textContent = message

    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = ''
    }, 1000)
  }
}

// Helper function to focus an element with proper error handling
export function focusElement(selector: string, options?: { preventScroll?: boolean }) {
  try {
    const element = document.querySelector(selector) as HTMLElement
    if (element && typeof element.focus === 'function') {
      element.focus(options)
      return true
    }
  } catch (error) {
    console.warn('Failed to focus element:', selector, error)
  }
  return false
}

// Helper function to trap focus within a container
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (e.key === 'Escape') {
      // Allow escape to close dialogs/modals
      const closeButton = container.querySelector('[aria-label*="close"], [aria-label*="বন্ধ"]') as HTMLElement
      if (closeButton) {
        closeButton.click()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Focus first element
  if (firstElement) {
    firstElement.focus()
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}