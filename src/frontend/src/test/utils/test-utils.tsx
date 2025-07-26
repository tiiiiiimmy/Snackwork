/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import type { User } from '../../types/api'

// Mock user for testing
const mockUser: User = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  level: 2,
  experiencePoints: 150,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  user?: User | null
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  const { user, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Helper to render with authenticated user
export const renderWithAuth = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, { ...options, user: mockUser })
}

// Helper to render without authentication
export const renderWithoutAuth = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  return customRender(ui, { ...options, user: null })
}

// re-export everything
export * from '@testing-library/react'
export { customRender as render, mockUser }