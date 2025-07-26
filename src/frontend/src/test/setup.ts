import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
})

afterAll(() => {
  server.close()
})

// Mock Google Maps
global.google = {
  maps: {
    Map: vi.fn().mockImplementation(() => ({
      setCenter: vi.fn(),
      addListener: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      addListener: vi.fn(),
    })),
    InfoWindow: vi.fn().mockImplementation(() => ({
      open: vi.fn(),
      close: vi.fn(),
    })),
    Size: vi.fn(),
    Point: vi.fn(),
    LatLng: vi.fn(),
  },
} as typeof google

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock environment variables
vi.mock('../utils/googleMaps', () => ({
  googleMapsLoader: {
    loadGoogleMaps: vi.fn().mockResolvedValue(undefined),
    isGoogleMapsLoaded: vi.fn().mockReturnValue(true),
  },
}))