import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AxiosInstance, AxiosError } from 'axios'

// Create mock functions with hoisting
const mockGet = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())
const mockInterceptors = vi.hoisted(() => ({
  request: { use: vi.fn() },
  response: { use: vi.fn() }
}))

// Mock axios with hoisted functions
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: mockInterceptors
    } as unknown as AxiosInstance))
  }
}))

// Import after mocking
import apiService from '../api'
import { mockUser, mockSnacks, mockCategories } from '../../test/mocks/data'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const loginData = { username: 'test', password: 'password' }
      const responseData = {
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: '2024-12-31T23:59:59Z'
      }

      mockPost.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.login(loginData)

      expect(mockPost).toHaveBeenCalledWith('/auth/login', loginData)
      expect(result).toEqual(responseData)
    })

    it('should register successfully', async () => {
      const registerData = { username: 'test', email: 'test@example.com', password: 'password' }
      const responseData = {
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: '2024-12-31T23:59:59Z'
      }

      mockPost.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.register(registerData)

      expect(mockPost).toHaveBeenCalledWith('/auth/register', registerData)
      expect(result).toEqual(responseData)
    })

    it('should logout successfully', async () => {
      mockPost.mockResolvedValueOnce({ data: { message: 'Logged out' } })

      await apiService.logout()

      expect(mockPost).toHaveBeenCalledWith('/auth/logout')
    })

    it('should refresh token successfully', async () => {
      const responseData = {
        user: mockUser,
        accessToken: 'new-token',
        expiresAt: '2024-12-31T23:59:59Z'
      }

      mockPost.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.refreshToken()

      expect(mockPost).toHaveBeenCalledWith('/auth/refresh')
      expect(result).toEqual(responseData)
    })

    it('should get user profile', async () => {
      mockGet.mockResolvedValueOnce({ data: mockUser })

      const result = await apiService.getCurrentUser()

      expect(mockGet).toHaveBeenCalledWith('/auth/profile')
      expect(result).toEqual(mockUser)
    })
  })

  describe('Snacks', () => {
    it('should get nearby snacks', async () => {
      const params = { lat: -36.8485, lng: 174.7633, radius: 1000 }
      mockGet.mockResolvedValueOnce({ data: mockSnacks })

      const result = await apiService.getSnacks(params.lat, params.lng, params.radius)

      expect(mockGet).toHaveBeenCalledWith('/snacks', { params })
      expect(result).toEqual(mockSnacks)
    })

    it('should get snack by id', async () => {
      const snackId = 'snack-1'
      const snack = mockSnacks[0]
      mockGet.mockResolvedValueOnce({ data: snack })

      const result = await apiService.getSnack(snackId)

      expect(mockGet).toHaveBeenCalledWith(`/snacks/${snackId}`)
      expect(result).toEqual(snack)
    })

    it('should create snack', async () => {
      const snackData = {
        name: 'New Snack',
        description: 'Description',
        categoryId: 'cat-1',
        location: {
          lat: -36.8485,
          lng: 174.7633
        },
        shopName: 'Shop',
        shopAddress: 'Address'
      }
      const createdSnack = { ...mockSnacks[0], ...snackData }
      mockPost.mockResolvedValueOnce({ data: createdSnack })

      const result = await apiService.createSnack(snackData)

      expect(mockPost).toHaveBeenCalledWith('/snacks', snackData)
      expect(result).toEqual(createdSnack)
    })

  })

  describe('Categories', () => {
    it('should get all categories', async () => {
      mockGet.mockResolvedValueOnce({ data: mockCategories })

      const result = await apiService.getCategories()

      expect(mockGet).toHaveBeenCalledWith('/categories')
      expect(result).toEqual(mockCategories)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: { name: ['Name is required'] }
          }
        }
      }

      const result = apiService.handleApiError(axiosError as AxiosError)

      expect(result).toEqual({
        message: 'Validation failed',
        status: 400,
        errors: { name: ['Name is required'] }
      })
    })

    it('should handle network errors', () => {
      const networkError = {
        request: {},
        response: undefined
      }

      const result = apiService.handleApiError(networkError as AxiosError)

      expect(result).toEqual({
        message: 'Network error - please check your connection',
        status: 0
      })
    })

    it('should handle unknown errors', () => {
      const unknownError = {
        message: 'Something went wrong'
      }

      const result = apiService.handleApiError(unknownError as Error)

      expect(result).toEqual({
        message: 'Something went wrong',
        status: 0
      })
    })
  })

  describe('Health Check', () => {
    it('should check health status', async () => {
      const healthData = { status: 'healthy', timestamp: '2024-01-01T00:00:00Z' }
      mockGet.mockResolvedValueOnce({ data: healthData })

      const result = await apiService.healthCheck()

      expect(mockGet).toHaveBeenCalledWith('/health')
      expect(result).toEqual(healthData)
    })
  })
})