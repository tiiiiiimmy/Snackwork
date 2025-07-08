import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup mock server for tests
export const server = setupServer(...handlers)