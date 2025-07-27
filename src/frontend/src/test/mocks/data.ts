import type { User, Snack, Category, Review } from '../../types/api'

export const mockUser: User = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  level: 2,
  experiencePoints: 150,
  avatarEmoji: '👤',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Sweet Snacks',
    description: 'Cookies, chocolates, and other sweet treats',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false
  },
  {
    id: 'cat-2',
    name: 'Savory Snacks',
    description: 'Chips, crackers, and salty snacks',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false
  },
  {
    id: 'cat-3',
    name: 'Healthy Snacks',
    description: 'Nuts, fruits, and nutritious options',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isDeleted: false
  }
]

export const mockSnacks: Snack[] = [
  {
    id: 'snack-1',
    name: 'Chocolate Chip Cookie',
    description: 'Delicious homemade chocolate chip cookie',
    categoryId: 'cat-1',
    category: 'Sweet Snacks', // Just the category name
    hasImage: true,
    store: {
      id: 'store-1',
      name: 'Sweet Treats Bakery',
      address: '123 Queen Street, Auckland',
      latitude: -36.8485,
      longitude: 174.7633,
      createdAt: '2024-01-01T00:00:00Z'
    },
    user: {
      id: 'user-1',
      username: 'testuser'
    },
    averageRating: 4.5,
    totalRatings: 12,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'snack-2',
    name: 'Potato Chips',
    description: 'Crispy and salty potato chips',
    categoryId: 'cat-2',
    category: 'Savory Snacks',
    hasImage: false,
    store: {
      id: 'store-2',
      name: 'Corner Store',
      address: '456 Main Street, Auckland',
      latitude: -36.8486,
      longitude: 174.7634,
      createdAt: '2024-01-01T00:00:00Z'
    },
    user: {
      id: 'user-1',
      username: 'testuser'
    },
    averageRating: 3.8,
    totalRatings: 8,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'snack-3',
    name: 'Trail Mix',
    description: 'Healthy mix of nuts and dried fruits',
    categoryId: 'cat-3',
    category: 'Healthy Snacks',
    hasImage: true,
    store: {
      id: 'store-3',
      name: 'Health Food Store',
      address: '789 Health Ave, Auckland',
      latitude: -36.8487,
      longitude: 174.7635,
      createdAt: '2024-01-01T00:00:00Z'
    },
    user: {
      id: 'user-2',
      username: 'healthyfoodie'
    },
    averageRating: 4.2,
    totalRatings: 15,
    createdAt: '2024-01-03T00:00:00Z'
  }
]

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Amazing cookie! Best I\'ve ever had.',
    createdAt: '2024-01-16T12:00:00Z',
    user: {
      id: 'user-2',
      username: 'snacklover'
    }
  },
  {
    id: 'review-2',
    rating: 4,
    comment: 'Really good, but a bit too sweet for me.',
    createdAt: '2024-01-17T15:30:00Z',
    user: {
      id: 'user-3',
      username: 'healthnut'
    }
  },
  {
    id: 'review-3',
    rating: 4,
    comment: 'Great crunch and flavor!',
    createdAt: '2024-01-21T11:20:00Z',
    user: {
      id: 'user-1',
      username: 'testuser'
    }
  }
]

export const mockApiError = {
  message: 'An error occurred',
  status: 500,
  errors: {}
}

export const mockValidationError = {
  message: 'Validation failed',
  status: 400,
  errors: {
    name: ['Name is required'],
    email: ['Email must be valid']
  }
}