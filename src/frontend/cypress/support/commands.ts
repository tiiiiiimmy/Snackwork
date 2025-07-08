/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>
      logout(): Chainable<void>
      register(username: string, email: string, password: string): Chainable<void>
      waitForMap(): Chainable<void>
      interceptApiCalls(): Chainable<void>
    }
  }
}

// Custom command to login
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="username-input"]').type(username)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-submit"]').click()
  
  // Wait for successful login (redirect to home)
  cy.url().should('eq', Cypress.config().baseUrl + '/')
  cy.get('[data-testid="user-menu"]').should('be.visible')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  
  // Wait for successful logout
  cy.url().should('eq', Cypress.config().baseUrl + '/')
  cy.get('[data-testid="login-link"]').should('be.visible')
})

// Custom command to register
Cypress.Commands.add('register', (username: string, email: string, password: string) => {
  cy.visit('/register')
  cy.get('[data-testid="username-input"]').type(username)
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="register-submit"]').click()
  
  // Wait for successful registration (redirect to home)
  cy.url().should('eq', Cypress.config().baseUrl + '/')
  cy.get('[data-testid="user-menu"]').should('be.visible')
})

// Custom command to wait for map to load
Cypress.Commands.add('waitForMap', () => {
  cy.get('[data-testid="map-container"]').should('be.visible')
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
})

// Custom command to setup API interceptors
Cypress.Commands.add('interceptApiCalls', () => {
  const apiUrl = Cypress.env('apiUrl')
  
  // Intercept auth endpoints
  cy.intercept('POST', `${apiUrl}/auth/login`).as('login')
  cy.intercept('POST', `${apiUrl}/auth/register`).as('register')
  cy.intercept('POST', `${apiUrl}/auth/logout`).as('logout')
  cy.intercept('GET', `${apiUrl}/auth/profile`).as('getProfile')
  
  // Intercept snacks endpoints
  cy.intercept('GET', `${apiUrl}/snacks*`).as('getSnacks')
  cy.intercept('GET', `${apiUrl}/snacks/*`).as('getSnack')
  cy.intercept('POST', `${apiUrl}/snacks`).as('createSnack')
  cy.intercept('PUT', `${apiUrl}/snacks/*`).as('updateSnack')
  cy.intercept('DELETE', `${apiUrl}/snacks/*`).as('deleteSnack')
  
  // Intercept categories
  cy.intercept('GET', `${apiUrl}/categories`).as('getCategories')
  
  // Intercept reviews
  cy.intercept('GET', `${apiUrl}/reviews/snack/*`).as('getReviews')
  cy.intercept('POST', `${apiUrl}/reviews`).as('createReview')
})