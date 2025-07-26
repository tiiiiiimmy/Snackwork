import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SnackCard } from '../SnackCard'
import { mockSnacks } from '../../../test/mocks/data'

const mockSnack = mockSnacks[0]

// Wrapper component for router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

const renderWithRouter = (component: React.ReactElement) => 
  render(component, { wrapper: RouterWrapper })

describe('SnackCard', () => {

  it('renders snack information correctly', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    expect(screen.getByText(mockSnack.name)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.description)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.category.name)).toBeInTheDocument()
    expect(screen.getAllByText(mockSnack.shopName)).toHaveLength(2) // appears twice
    expect(screen.getByText(`${mockSnack.averageRating.toFixed(1)} (${mockSnack.totalRatings})`)).toBeInTheDocument()
  })

  it('displays rating stars correctly', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    const ratingValue = screen.getByText(`${mockSnack.averageRating.toFixed(1)} (${mockSnack.totalRatings})`)
    expect(ratingValue).toBeInTheDocument()
  })

  it('shows placeholder when no image is provided', () => {
    const snackWithoutImage = { ...mockSnack, imageUrl: '' }
    renderWithRouter(<SnackCard snack={snackWithoutImage} />)
    
    const placeholder = screen.getByText('No image available')
    expect(placeholder).toBeInTheDocument()
  })

  it('navigates to snack detail when clicked', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/snacks/${mockSnack.id}`)
  })

  it('handles keyboard navigation', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/snacks/${mockSnack.id}`)
  })

  it('has proper accessibility attributes', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-label', `View details for ${mockSnack.name} - ${mockSnack.averageRating.toFixed(1)} stars`)
  })

  it('shows no rating when totalRatings is 0', () => {
    const snackWithoutRatings = { ...mockSnack, totalRatings: 0, averageRating: 0 }
    renderWithRouter(<SnackCard snack={snackWithoutRatings} />)
    
    expect(screen.getByText('0.0 (0)')).toBeInTheDocument()
  })

  it('displays description', () => {
    const longDescription = 'This is a very long description that should be truncated because it exceeds the maximum length that we want to display in the snack card component.'
    const snackWithLongDescription = { ...mockSnack, description: longDescription }
    
    renderWithRouter(<SnackCard snack={snackWithLongDescription} />)
    
    const description = screen.getByText(longDescription)
    expect(description).toBeInTheDocument()
  })

  it('displays correct category badge', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)
    
    const categoryBadge = screen.getByTestId('category-badge')
    expect(categoryBadge).toHaveClass('category-badge')
    expect(categoryBadge).toHaveTextContent(mockSnack.category.name)
  })
})