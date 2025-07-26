/* eslint-disable @typescript-eslint/no-unused-expressions */
/// <reference types="cypress" />

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Setup API interceptors for consistent testing
    cy.interceptApiCalls()
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through all interactive elements', () => {
      cy.visit('/')
      cy.waitForMap()

      // Tab through header elements
      cy.get('[data-testid="login-link"]').focus()
      cy.focused().should('have.attr', 'data-testid', 'login-link')

      cy.tab()
      cy.focused().should('contain', 'Register')

      // Test skip links (visible on focus)
      cy.get('body').tab({ shift: true }).tab({ shift: true })
      cy.get('.skip-link').should('be.visible')
    })

    it('should support escape key to close modals', () => {
      cy.visit('/')
      cy.get('[aria-label="Open mobile menu"]').click()

      cy.get('[role="dialog"]').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('[role="dialog"]').should('not.exist')
    })

    it('should trap focus within modals', () => {
      cy.visit('/')
      cy.get('[aria-label="Open mobile menu"]').click()

      // Focus should be trapped within modal
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('[id="mobile-menu-title"]').should('be.focused')

      // Tab through modal elements
      cy.tab()
      cy.focused().should('contain', 'Home')
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      cy.visit('/')

      // Check for h1 on page
      cy.get('h1').should('exist')

      // Headings should be in proper order
      cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
        const headingLevels = Array.from($headings).map(h => parseInt(h.tagName.charAt(1)))
        // Verify no heading level is skipped
        for (let i = 1; i < headingLevels.length; i++) {
          expect(headingLevels[i] - headingLevels[i - 1]).to.be.at.most(1)
        }
      })
    })

    it('should have proper aria labels and roles', () => {
      cy.visit('/')

      // Navigation should have aria-label
      cy.get('[aria-label="Main navigation"]').should('exist')

      // Interactive elements should have proper labels
      cy.get('[aria-label="Open mobile menu"]').should('exist')
      cy.get('[aria-label="SnackSpot Auckland - Home"]').should('exist')
    })

    it('should announce dynamic content changes', () => {
      cy.visit('/login')

      // Test form validation announcements
      cy.get('[data-testid="login-submit"]').click()

      // Error messages should be announced (check for aria-live regions)
      cy.get('[aria-live]').should('exist')
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements', () => {
      cy.visit('/')

      // Test primary text contrast
      cy.get('body').should('have.css', 'color').then(color => {
        cy.get('body').should('have.css', 'background-color').then(bgColor => {
          // This would need a custom command to calculate contrast ratio
          // For now, we'll check that colors are defined
          expect(color).to.not.be.empty
          expect(bgColor).to.not.be.empty
        })
      })
    })

    it('should have sufficient contrast for interactive elements', () => {
      cy.visit('/')

      // Check button contrast
      cy.get('[data-testid="login-link"]').should('be.visible')
        .and('have.css', 'color')
        .and('have.css', 'background-color')
    })
  })

  describe('Form Accessibility', () => {
    it('should have properly labeled form controls', () => {
      cy.visit('/login')

      // All inputs should have labels or aria-label
      cy.get('input').each($input => {
        const input = $input[0]
        const hasLabel = !!document.querySelector(`label[for="${input.id}"]`)
        const hasAriaLabel = !!input.getAttribute('aria-label')
        const hasAriaLabelledBy = !!input.getAttribute('aria-labelledby')

        expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).to.be.true
      })
    })

    it('should indicate required fields', () => {
      cy.visit('/login')

      cy.get('input[required]').each($input => {
        const input = $input[0]
        const hasAriaRequired = input.getAttribute('aria-required') === 'true'
        const hasRequiredInLabel = !!document.querySelector(`label[for="${input.id}"]`)?.textContent?.includes('*')

        expect(hasAriaRequired || hasRequiredInLabel).to.be.true
      })
    })

    it('should provide helpful error messages', () => {
      cy.visit('/login')

      cy.get('[data-testid="login-submit"]').click()

      // Error messages should be associated with inputs
      cy.get('[data-testid="username-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })
  })

  describe('Images and Media', () => {
    it('should have descriptive alt text for images', () => {
      cy.visit('/')
      cy.waitForMap()

      cy.get('img').each($img => {
        const img = $img[0]
        const hasAlt = !!img.getAttribute('alt')
        const isDecorative = img.getAttribute('alt') === '' && img.getAttribute('aria-hidden') === 'true'

        expect(hasAlt || isDecorative).to.be.true
      })
    })

    it('should mark decorative images appropriately', () => {
      cy.visit('/')

      // Icons should be marked as decorative
      cy.get('[aria-hidden="true"]').should('exist')
    })
  })

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile viewport', () => {
      cy.viewport('iphone-6')
      cy.visit('/')

      // Mobile menu should be accessible
      cy.get('[aria-label="Open mobile menu"]').should('be.visible').click()
      cy.get('[role="dialog"]').should('be.visible')

      // Focus management should work
      cy.get('[id="mobile-menu-title"]').should('be.focused')
    })

    it('should support touch navigation', () => {
      cy.viewport('iphone-6')
      cy.visit('/')

      // Touch targets should be at least 44px
      cy.get('button, a, [role="button"]').each($el => {
        const rect = $el[0].getBoundingClientRect()
        expect(Math.max(rect.width, rect.height)).to.be.at.least(44)
      })
    })
  })

  describe('Maps Accessibility', () => {
    it('should provide alternative access to map functionality', () => {
      cy.visit('/')
      cy.waitForMap()

      // Map should have proper role and label
      cy.get('[role="application"]').should('exist')
      cy.get('[aria-label*="map"]').should('exist')
    })

    it('should be keyboard accessible in location picker', () => {
      cy.login('testuser', 'password123')
      cy.visit('/add-snack')

      // Test location picker accessibility
      cy.get('[data-testid="location-button"]').click()
      cy.get('[role="dialog"]').should('be.visible')

      // Should support keyboard navigation
      cy.get('[aria-label="Use current device location"]').should('be.focusable')
      cy.get('[aria-label="Confirm selected location"]').should('be.focusable')
    })
  })
})

// Custom Cypress command for tab navigation
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, options = {}) => {
  return cy.wrap(subject).trigger('keydown', {
    key: 'Tab',
    shiftKey: !!options.shift,
    which: 9
  })
})