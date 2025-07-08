import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import apiService from '../api'
import { mockUser, mockSnacks, mockCategories } from '../../test/mocks/data'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset axios create mock
    mockedAxios.create.mockReturnValue(mockedAxios as any)
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

      mockedAxios.post.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.login(loginData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData)
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

      mockedAxios.post.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.register(registerData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(result).toEqual(responseData)
    })

    it('should logout successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Logged out' } })

      await apiService.logout()

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('should refresh token successfully', async () => {
      const responseData = {
        user: mockUser,
        accessToken: 'new-token',
        expiresAt: '2024-12-31T23:59:59Z'
      }

      mockedAxios.post.mockResolvedValueOnce({ data: responseData })

      const result = await apiService.refreshToken()

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh')
      expect(result).toEqual(responseData)
    })

    it('should get user profile', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser })

      const result = await apiService.getProfile()

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile')
      expect(result).toEqual(mockUser)
    })
  })

  describe('Snacks', () => {
    it('should get nearby snacks', async () => {
      const params = { lat: -36.8485, lng: 174.7633, radius: 1000 }
      mockedAxios.get.mockResolvedValueOnce({ data: mockSnacks })

      const result = await apiService.getNearbySnacks(params.lat, params.lng, params.radius)

      expect(mockedAxios.get).toHaveBeenCalledWith('/snacks', { params })
      expect(result).toEqual(mockSnacks)
    })

    it('should get snack by id', async () => {
      const snackId = 'snack-1'
      const snack = mockSnacks[0]
      mockedAxios.get.mockResolvedValueOnce({ data: snack })

      const result = await apiService.getSnack(snackId)

      expect(mockedAxios.get).toHaveBeenCalledWith(`/snacks/${snackId}`)
      expect(result).toEqual(snack)
    })

    it('should create snack', async () => {
      const snackData = {
        name: 'New Snack',
        description: 'Description',
        categoryId: 'cat-1',
        latitude: -36.8485,
        longitude: 174.7633,
        shopName: 'Shop',
        shopAddress: 'Address'
      }
      const createdSnack = { ...mockSnacks[0], ...snackData }
      mockedAxios.post.mockResolvedValueOnce({ data: createdSnack })

      const result = await apiService.createSnack(snackData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/snacks', snackData)
      expect(result).toEqual(createdSnack)
    })

    it('should update snack', async () => {
      const snackId = 'snack-1'
      const updateData = { name: 'Updated Snack' }
      const updatedSnack = { ...mockSnacks[0], ...updateData }
      mockedAxios.put.mockResolvedValueOnce({ data: updatedSnack })

      const result = await apiService.updateSnack(snackId, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/snacks/${snackId}`, updateData)
      expect(result).toEqual(updatedSnack)
    })

    it('should delete snack', async () => {
      const snackId = 'snack-1'
      mockedAxios.delete.mockResolvedValueOnce({ data: null })

      await apiService.deleteSnack(snackId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/snacks/${snackId}`)
    })
  })

  describe('Categories', () => {
    it('should get all categories', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockCategories })

      const result = await apiService.getCategories()

      expect(mockedAxios.get).toHaveBeenCalledWith('/categories')
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

      const result = apiService.handleApiError(axiosError as any)

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

      const result = apiService.handleApiError(networkError as any)

      expect(result).toEqual({
        message: 'Network error - please check your connection',
        status: 0
      })
    })

    it('should handle unknown errors', () => {
      const unknownError = {
        message: 'Something went wrong'
      }

      const result = apiService.handleApiError(unknownError as any)

      expect(result).toEqual({
        message: 'Something went wrong',
        status: 0
      })
    })
  })

  describe('Health Check', () => {
    it('should check health status', async () => {
      const healthData = { status: 'healthy', timestamp: '2024-01-01T00:00:00Z' }
      mockedAxios.get.mockResolvedValueOnce({ data: healthData })

      const result = await apiService.healthCheck()

      expect(mockedAxios.get).toHaveBeenCalledWith('/health')
      expect(result).toEqual(healthData)
    })
  })
})