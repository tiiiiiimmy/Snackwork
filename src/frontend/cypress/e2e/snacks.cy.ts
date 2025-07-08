describe('Snacks Feature', () => {
  beforeEach(() => {
    cy.interceptApiCalls()
  })

  describe('Snack Discovery', () => {
    it('should display map and snacks on home page', () => {
      cy.visit('/')
      
      cy.waitForMap()
      cy.wait('@getSnacks')
      
      cy.get('[data-testid="snack-card"]').should('have.length.at.least', 1)
      cy.get('[data-testid="snack-count-badge"]').should('be.visible')
    })

    it('should filter snacks by category', () => {
      cy.visit('/')
      cy.waitForMap()
      
      cy.get('[data-testid="category-filter"]').select('Sweet Snacks')
      
      cy.wait('@getSnacks')
      cy.get('[data-testid="snack-card"]').each($card => {
        cy.wrap($card).find('[data-testid="category-badge"]').should('contain', 'Sweet')
      })
    })

    it('should search snacks by name', () => {
      cy.visit('/')
      cy.waitForMap()
      
      cy.get('[data-testid="search-input"]').type('chocolate')
      cy.get('[data-testid="search-button"]').click()
      
      cy.wait('@getSnacks')
      cy.get('[data-testid="snack-card"]').should('contain.text', 'chocolate')
    })
  })

  describe('Snack Details', () => {
    it('should view snack details', () => {
      cy.visit('/')
      cy.waitForMap()
      
      cy.get('[data-testid="snack-card"]').first().click()
      
      cy.wait('@getSnack')
      cy.wait('@getReviews')
      
      cy.get('[data-testid="snack-detail"]').should('be.visible')
      cy.get('[data-testid="snack-name"]').should('be.visible')
      cy.get('[data-testid="snack-description"]').should('be.visible')
      cy.get('[data-testid="snack-rating"]').should('be.visible')
    })

    it('should display reviews for snack', () => {
      cy.visit('/snacks/snack-1')
      
      cy.wait('@getSnack')
      cy.wait('@getReviews')
      
      cy.get('[data-testid="review-card"]').should('have.length.at.least', 1)
      cy.get('[data-testid="review-rating"]').should('be.visible')
      cy.get('[data-testid="review-comment"]').should('be.visible')
    })
  })

  describe('Snack Creation', () => {
    beforeEach(() => {
      cy.login('testuser', 'password123')
    })

    it('should create a new snack', () => {
      cy.visit('/add-snack')
      
      cy.get('[data-testid="snack-name-input"]').type('Test Snack')
      cy.get('[data-testid="snack-description-input"]').type('A delicious test snack')
      cy.get('[data-testid="category-select"]').select('Sweet Snacks')
      cy.get('[data-testid="shop-name-input"]').type('Test Shop')
      cy.get('[data-testid="shop-address-input"]').type('123 Test Street')
      
      // Click on map to set location
      cy.get('[data-testid="map-container"]').click()
      
      cy.get('[data-testid="submit-snack"]').click()
      
      cy.wait('@createSnack')
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="success-message"]').should('contain', 'Snack added successfully')
    })

    it('should validate required fields', () => {
      cy.visit('/add-snack')
      
      cy.get('[data-testid="submit-snack"]').click()
      
      cy.get('[data-testid="name-error"]').should('be.visible')
      cy.get('[data-testid="category-error"]').should('be.visible')
      cy.get('[data-testid="location-error"]').should('be.visible')
    })
  })

  describe('Snack Management', () => {
    beforeEach(() => {
      cy.login('testuser', 'password123')
    })

    it('should edit own snack', () => {
      cy.visit('/snacks/snack-1')
      
      cy.get('[data-testid="edit-snack-button"]').click()
      
      cy.get('[data-testid="snack-name-input"]').clear().type('Updated Snack Name')
      cy.get('[data-testid="submit-snack"]').click()
      
      cy.wait('@updateSnack')
      cy.get('[data-testid="snack-name"]').should('contain', 'Updated Snack Name')
    })

    it('should delete own snack', () => {
      cy.visit('/snacks/snack-1')
      
      cy.get('[data-testid="delete-snack-button"]').click()
      cy.get('[data-testid="confirm-delete"]').click()
      
      cy.wait('@deleteSnack')
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="success-message"]').should('contain', 'Snack deleted successfully')
    })

    it('should not show edit/delete buttons for other users snacks', () => {
      // Visit a snack created by another user
      cy.visit('/snacks/snack-2')
      
      cy.get('[data-testid="edit-snack-button"]').should('not.exist')
      cy.get('[data-testid="delete-snack-button"]').should('not.exist')
    })
  })

  describe('Reviews', () => {
    beforeEach(() => {
      cy.login('testuser', 'password123')
    })

    it('should add a review to a snack', () => {
      cy.visit('/snacks/snack-1')
      
      cy.get('[data-testid="rating-5"]').click()
      cy.get('[data-testid="review-comment-input"]').type('Excellent snack!')
      cy.get('[data-testid="submit-review"]').click()
      
      cy.wait('@createReview')
      cy.get('[data-testid="review-card"]').should('contain', 'Excellent snack!')
    })

    it('should validate review rating', () => {
      cy.visit('/snacks/snack-1')
      
      cy.get('[data-testid="review-comment-input"]').type('Great snack!')
      cy.get('[data-testid="submit-review"]').click()
      
      cy.get('[data-testid="rating-error"]').should('contain', 'Please select a rating')
    })
  })
})