describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.interceptApiCalls()
  })

  describe('Login', () => {
    it('should allow user to login with valid credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-testid="username-input"]').type('testuser')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-submit"]').click()
      
      cy.wait('@login')
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-testid="username-input"]').type('invaliduser')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-submit"]').click()
      
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
    })

    it('should validate required fields', () => {
      cy.visit('/login')
      
      cy.get('[data-testid="login-submit"]').click()
      
      cy.get('[data-testid="username-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })
  })

  describe('Registration', () => {
    it('should allow user to register with valid data', () => {
      cy.visit('/register')
      
      cy.get('[data-testid="username-input"]').type('newuser')
      cy.get('[data-testid="email-input"]').type('newuser@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="register-submit"]').click()
      
      cy.wait('@register')
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })

    it('should validate email format', () => {
      cy.visit('/register')
      
      cy.get('[data-testid="username-input"]').type('newuser')
      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="register-submit"]').click()
      
      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="email-error"]').should('contain', 'valid email')
    })

    it('should validate password strength', () => {
      cy.visit('/register')
      
      cy.get('[data-testid="username-input"]').type('newuser')
      cy.get('[data-testid="email-input"]').type('newuser@example.com')
      cy.get('[data-testid="password-input"]').type('123')
      cy.get('[data-testid="register-submit"]').click()
      
      cy.get('[data-testid="password-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('contain', 'at least 6 characters')
    })
  })

  describe('Logout', () => {
    it('should allow user to logout', () => {
      // Login first
      cy.login('testuser', 'password123')
      
      // Logout
      cy.logout()
      
      cy.wait('@logout')
      cy.get('[data-testid="login-link"]').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/add-snack')
      
      cy.url().should('include', '/login')
      cy.get('[data-testid="login-form"]').should('be.visible')
    })

    it('should allow access to protected route when authenticated', () => {
      cy.login('testuser', 'password123')
      
      cy.visit('/add-snack')
      
      cy.url().should('include', '/add-snack')
      cy.get('[data-testid="add-snack-form"]').should('be.visible')
    })
  })
})