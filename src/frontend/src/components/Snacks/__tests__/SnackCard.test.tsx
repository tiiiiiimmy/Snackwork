import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/test-utils'
import { SnackCard } from '../SnackCard'
import { mockSnacks } from '../../../test/mocks/data'

const mockSnack = mockSnacks[0]

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SnackCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders snack information correctly', () => {
    render(<SnackCard snack={mockSnack} />)
    
    expect(screen.getByText(mockSnack.name)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.description)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.category.name)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.shopName)).toBeInTheDocument()
    expect(screen.getByText(mockSnack.averageRating.toString())).toBeInTheDocument()
    expect(screen.getByText(`(${mockSnack.totalRatings} reviews)`)).toBeInTheDocument()
  })

  it('displays rating stars correctly', () => {
    render(<SnackCard snack={mockSnack} />)
    
    const stars = screen.getAllByText('⭐')
    // Should show filled stars based on rating (4.5 rounds to 5 stars)
    expect(stars).toHaveLength(5)
  })

  it('shows placeholder when no image is provided', () => {
    const snackWithoutImage = { ...mockSnack, imageUrl: '' }
    render(<SnackCard snack={snackWithoutImage} />)
    
    const placeholder = screen.getByText('🍪')
    expect(placeholder).toBeInTheDocument()
  })

  it('navigates to snack detail when clicked', () => {
    render(<SnackCard snack={mockSnack} />)
    
    const card = screen.getByTestId('snack-card')
    fireEvent.click(card)
    
    expect(mockNavigate).toHaveBeenCalledWith(`/snacks/${mockSnack.id}`)
  })

  it('handles keyboard navigation', () => {
    render(<SnackCard snack={mockSnack} />)
    
    const card = screen.getByTestId('snack-card')
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith(`/snacks/${mockSnack.id}`)
    
    mockNavigate.mockClear()
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ', code: 'Space' })
    expect(mockNavigate).toHaveBeenCalledWith(`/snacks/${mockSnack.id}`)
  })

  it('has proper accessibility attributes', () => {
    render(<SnackCard snack={mockSnack} />)
    
    const card = screen.getByTestId('snack-card')
    expect(card).toHaveAttribute('role', 'button')
    expect(card).toHaveAttribute('tabIndex', '0')
    expect(card).toHaveAttribute('aria-label', `View details for ${mockSnack.name}`)
  })

  it('shows no rating when totalRatings is 0', () => {
    const snackWithoutRatings = { ...mockSnack, totalRatings: 0, averageRating: 0 }
    render(<SnackCard snack={snackWithoutRatings} />)
    
    expect(screen.getByText('No reviews yet')).toBeInTheDocument()
  })

  it('truncates long descriptions', () => {
    const longDescription = 'This is a very long description that should be truncated because it exceeds the maximum length that we want to display in the snack card component.'
    const snackWithLongDescription = { ...mockSnack, description: longDescription }
    
    render(<SnackCard snack={snackWithLongDescription} />)
    
    const description = screen.getByText(longDescription.substring(0, 100) + '...')
    expect(description).toBeInTheDocument()
  })

  it('displays correct category badge color', () => {
    render(<SnackCard snack={mockSnack} />)
    
    const categoryBadge = screen.getByText(mockSnack.category.name)
    expect(categoryBadge).toHaveClass('category-badge')
  })
})