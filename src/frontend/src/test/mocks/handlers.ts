import { http, HttpResponse } from 'msw'
import { mockUser, mockSnacks, mockCategories, mockReviews } from './data'

const API_BASE = 'http://localhost:5000/api/v1'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })
  }),

  http.post(`${API_BASE}/auth/login`, ({ request }) => {
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })
  }),

  http.get(`${API_BASE}/auth/profile`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'mock-new-access-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // Snacks endpoints
  http.get(`${API_BASE}/snacks`, ({ request }) => {
    const url = new URL(request.url)
    const lat = url.searchParams.get('lat')
    const lng = url.searchParams.get('lng')
    const radius = url.searchParams.get('radius')
    
    if (!lat || !lng || !radius) {
      return HttpResponse.json({ message: 'Missing required parameters' }, { status: 400 })
    }
    
    return HttpResponse.json(mockSnacks)
  }),

  http.get(`${API_BASE}/snacks/:id`, ({ params }) => {
    const snack = mockSnacks.find(s => s.id === params.id)
    if (!snack) {
      return HttpResponse.json({ message: 'Snack not found' }, { status: 404 })
    }
    return HttpResponse.json(snack)
  }),

  http.post(`${API_BASE}/snacks`, () => {
    const newSnack = {
      ...mockSnacks[0],
      id: 'new-snack-id',
      name: 'New Test Snack'
    }
    return HttpResponse.json(newSnack, { status: 201 })
  }),

  http.put(`${API_BASE}/snacks/:id`, ({ params }) => {
    const snack = mockSnacks.find(s => s.id === params.id)
    if (!snack) {
      return HttpResponse.json({ message: 'Snack not found' }, { status: 404 })
    }
    return HttpResponse.json({ ...snack, name: 'Updated Snack' })
  }),

  http.delete(`${API_BASE}/snacks/:id`, ({ params }) => {
    const snack = mockSnacks.find(s => s.id === params.id)
    if (!snack) {
      return HttpResponse.json({ message: 'Snack not found' }, { status: 404 })
    }
    return HttpResponse.json(null, { status: 204 })
  }),

  // Categories endpoints
  http.get(`${API_BASE}/categories`, () => {
    return HttpResponse.json(mockCategories)
  }),

  // Reviews endpoints
  http.get(`${API_BASE}/reviews/snack/:snackId`, ({ params }) => {
    const reviews = mockReviews.filter(r => r.snackId === params.snackId)
    return HttpResponse.json(reviews)
  }),

  http.post(`${API_BASE}/reviews`, () => {
    const newReview = {
      ...mockReviews[0],
      id: 'new-review-id',
      comment: 'New test review'
    }
    return HttpResponse.json(newReview, { status: 201 })
  }),

  http.put(`${API_BASE}/reviews/:id`, ({ params }) => {
    const review = mockReviews.find(r => r.id === params.id)
    if (!review) {
      return HttpResponse.json({ message: 'Review not found' }, { status: 404 })
    }
    return HttpResponse.json({ ...review, comment: 'Updated review' })
  }),

  http.delete(`${API_BASE}/reviews/:id`, ({ params }) => {
    const review = mockReviews.find(r => r.id === params.id)
    if (!review) {
      return HttpResponse.json({ message: 'Review not found' }, { status: 404 })
    }
    return HttpResponse.json(null, { status: 204 })
  }),

  // Health check
  http.get(`${API_BASE}/../health`, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
  }),

  // Fallback for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`)
    return HttpResponse.json({ message: 'Not found' }, { status: 404 })
  })
]