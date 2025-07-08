// Accessibility utilities for WCAG 2.1 AA compliance

/**
 * Announces content to screen readers
 */
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Manages focus for modals and overlays
 */
export class FocusTrap {
  private element: HTMLElement
  private previousFocus: HTMLElement | null = null
  private focusableElements: HTMLElement[] = []

  constructor(element: HTMLElement) {
    this.element = element
  }

  activate() {
    this.previousFocus = document.activeElement as HTMLElement
    this.updateFocusableElements()
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus()
    }
    
    document.addEventListener('keydown', this.handleKeyDown)
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown)
    
    if (this.previousFocus) {
      this.previousFocus.focus()
    }
  }

  private updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ]
    
    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[]
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (this.focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    const firstElement = this.focusableElements[0]
    const lastElement = this.focusableElements[this.focusableElements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
}

/**
 * Checks color contrast ratio
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Validates if contrast meets WCAG AA standards
 */
export const meetsContrastRequirements = (
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Creates unique IDs for form elements
 */
export const generateId = (prefix: string = 'element'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Skip link navigation
 */
export const createSkipLink = (targetId: string, text: string): HTMLElement => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'skip-link'
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView()
    }
  })
  
  return skipLink
}

/**
 * Keyboard navigation helpers
 */
export const handleArrowKeyNavigation = (
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  isVertical: boolean = true
): number => {
  const { key } = event
  let newIndex = currentIndex

  if (isVertical) {
    if (key === 'ArrowDown') {
      newIndex = (currentIndex + 1) % items.length
    } else if (key === 'ArrowUp') {
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    }
  } else {
    if (key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % items.length
    } else if (key === 'ArrowLeft') {
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    }
  }

  if (key === 'Home') {
    newIndex = 0
  } else if (key === 'End') {
    newIndex = items.length - 1
  }

  if (newIndex !== currentIndex) {
    event.preventDefault()
    items[newIndex].focus()
  }

  return newIndex
}

/**
 * ARIA live region for dynamic content
 */
export class LiveRegion {
  private element: HTMLElement

  constructor(politeness: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div')
    this.element.setAttribute('aria-live', politeness)
    this.element.setAttribute('aria-atomic', 'true')
    this.element.className = 'sr-only'
    document.body.appendChild(this.element)
  }

  announce(message: string) {
    this.element.textContent = message
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}

/**
 * Validates form accessibility
 */
export const validateFormAccessibility = (form: HTMLFormElement): string[] => {
  const issues: string[] = []
  const inputs = form.querySelectorAll('input, textarea, select')

  inputs.forEach((input) => {
    const element = input as HTMLElement
    const label = form.querySelector(`label[for="${element.id}"]`)
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')

    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Input element missing label: ${element.tagName} ${element.id || element.name || 'unknown'}`)
    }

    if (element.hasAttribute('required') && !element.getAttribute('aria-required')) {
      issues.push(`Required field missing aria-required: ${element.id || element.name || 'unknown'}`)
    }
  })

  return issues
}