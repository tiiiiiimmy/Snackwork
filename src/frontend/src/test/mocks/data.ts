import type { User, Snack, Category, Review } from '../../types/api'

export const mockUser: User = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  level: 2,
  experiencePoints: 150,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Sweet Snacks',
    description: 'Cookies, chocolates, and other sweet treats',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'Savory Snacks',
    description: 'Chips, crackers, and salty snacks',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Healthy Snacks',
    description: 'Nuts, fruits, and nutritious options',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export const mockSnacks: Snack[] = [
  {
    id: 'snack-1',
    name: 'Chocolate Chip Cookie',
    description: 'Delicious homemade chocolate chip cookie',
    categoryId: 'cat-1',
    category: mockCategories[0],
    userId: 'user-1',
    username: 'testuser',
    latitude: -36.8485,
    longitude: 174.7633,
    location: 'Auckland CBD',
    shopName: 'Sweet Treats Bakery',
    shopAddress: '123 Queen Street, Auckland',
    imageUrl: 'https://example.com/cookie.jpg',
    averageRating: 4.5,
    totalRatings: 12,
    dataSource: 'user',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'snack-2',
    name: 'Potato Chips',
    description: 'Crispy salted potato chips',
    categoryId: 'cat-2',
    category: mockCategories[1],
    userId: 'user-2',
    username: 'snacklover',
    latitude: -36.8600,
    longitude: 174.7700,
    location: 'Ponsonby',
    shopName: 'Corner Store',
    shopAddress: '456 Ponsonby Road, Auckland',
    imageUrl: 'https://example.com/chips.jpg',
    averageRating: 3.8,
    totalRatings: 8,
    dataSource: 'user',
    createdAt: '2024-01-20T14:15:00Z',
    updatedAt: '2024-01-20T14:15:00Z'
  },
  {
    id: 'snack-3',
    name: 'Mixed Nuts',
    description: 'Healthy mix of almonds, cashews, and walnuts',
    categoryId: 'cat-3',
    category: mockCategories[2],
    userId: 'user-3',
    username: 'healthnut',
    latitude: -36.8700,
    longitude: 174.7500,
    location: 'Newmarket',
    shopName: 'Health Food Store',
    shopAddress: '789 Broadway, Newmarket',
    imageUrl: 'https://example.com/nuts.jpg',
    averageRating: 4.2,
    totalRatings: 15,
    dataSource: 'user',
    createdAt: '2024-01-25T09:45:00Z',
    updatedAt: '2024-01-25T09:45:00Z'
  }
]

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    snackId: 'snack-1',
    userId: 'user-2',
    username: 'snacklover',
    rating: 5,
    comment: 'Amazing cookie! Best I\'ve ever had.',
    createdAt: '2024-01-16T12:00:00Z',
    updatedAt: '2024-01-16T12:00:00Z'
  },
  {
    id: 'review-2',
    snackId: 'snack-1',
    userId: 'user-3',
    username: 'healthnut',
    rating: 4,
    comment: 'Really good, but a bit too sweet for me.',
    createdAt: '2024-01-17T15:30:00Z',
    updatedAt: '2024-01-17T15:30:00Z'
  },
  {
    id: 'review-3',
    snackId: 'snack-2',
    userId: 'user-1',
    username: 'testuser',
    rating: 4,
    comment: 'Great crunch and flavor!',
    createdAt: '2024-01-21T11:20:00Z',
    updatedAt: '2024-01-21T11:20:00Z'
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