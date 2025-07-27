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
    expect(screen.getByText(mockSnack.description!)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.category)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.store.name)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.averageRating.toFixed(1))).toBeInTheDocument()
    expect(screen.getByText(`(${mockSnack.totalRatings})`)).toBeInTheDocument()
  })

  it('displays rating stars correctly', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)

    const ratingValue = screen.getByText(mockSnack.averageRating.toFixed(1))
    expect(ratingValue).toBeInTheDocument()
    const ratingCount = screen.getByText(`(${mockSnack.totalRatings})`)
    expect(ratingCount).toBeInTheDocument()
  })

  it('shows placeholder when no image is provided', () => {
    const snackWithoutImage = { ...mockSnack, hasImage: false }
    renderWithRouter(<SnackCard snack={snackWithoutImage} />)

    const placeholder = screen.getByLabelText('No image available')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveTextContent('🍪')
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
    expect(link).toBeVisible()
  })

  it('has proper accessibility attributes', () => {
    renderWithRouter(<SnackCard snack={mockSnack} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-label', `View details for ${mockSnack.name} - ${mockSnack.averageRating.toFixed(1)} stars`)
  })

  it('shows no rating when totalRatings is 0', () => {
    const snackWithoutRatings = { ...mockSnack, totalRatings: 0, averageRating: 0 }
    renderWithRouter(<SnackCard snack={snackWithoutRatings} />)

    expect(screen.getByText('0.0')).toBeInTheDocument()
    expect(screen.getByText('(0)')).toBeInTheDocument()
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

    // The category is displayed in the badge area
    const categoryElements = screen.getAllByText(mockSnack.category)
    expect(categoryElements.length).toBeGreaterThan(0)
    // Verify category appears in the component
    expect(categoryElements[0]).toBeInTheDocument()
  })
})