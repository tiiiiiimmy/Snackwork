import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { mockUser } from '../../test/mocks/data'

// Create hoisted mock functions
const mockLogin = vi.hoisted(() => vi.fn())
const mockRegister = vi.hoisted(() => vi.fn())
const mockLogout = vi.hoisted(() => vi.fn())
const mockRefreshToken = vi.hoisted(() => vi.fn())

// Mock the API service with hoisted functions
vi.mock('../../services/api', () => ({
  default: {
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    refreshToken: mockRefreshToken,
  }
}))

// Import after mocking
import { AuthProvider } from '../AuthContext'
import { useAuth } from '../../hooks/useAuth'

// Test component to access auth context
const TestComponent = () => {
  const { user, login, logout, register, loading } = useAuth()
  
  return (
    <div>
      <div data-testid="user-info">
        {user ? `Welcome ${user.username}` : 'Not logged in'}
      </div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ username: 'test', password: 'password' })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button 
        data-testid="register-btn" 
        onClick={() => register({ username: 'test', email: 'test@example.com', password: 'password' })}
      >
        Register
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock returns
    mockLogin.mockResolvedValue({ user: mockUser })
    mockRegister.mockResolvedValue({ user: mockUser })
    mockLogout.mockResolvedValue({})
    mockRefreshToken.mockRejectedValue(new Error('No token'))
  })

  it('provides initial state when no user is authenticated', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in')
  })

  it('provides user when initially authenticated', async () => {
    // Mock successful token refresh for this test
    mockRefreshToken.mockResolvedValueOnce({ user: mockUser })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(`Welcome ${mockUser.username}`)
    })
  })

  it('handles login successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(`Welcome ${mockUser.username}`)
    })
  })

  it('handles register successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const registerBtn = screen.getByTestId('register-btn')
    fireEvent.click(registerBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(`Welcome ${mockUser.username}`)
    })
  })

  it('handles logout successfully', async () => {
    // First login to have something to logout from
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    // Login first
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(`Welcome ${mockUser.username}`)
    })
    
    // Then logout
    const logoutBtn = screen.getByTestId('logout-btn')
    fireEvent.click(logoutBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in')
    })
  })

  it('shows loading state during operations', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    // Should show loading state briefly
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    })
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    console.error = originalError
  })
})