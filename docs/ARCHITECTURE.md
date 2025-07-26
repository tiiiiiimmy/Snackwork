# SnackSpot Auckland - Architecture Documentation

## Overview

SnackSpot Auckland is a gamified, community-driven platform for discovering and sharing snacks in Auckland, New Zealand. The application follows a modern, scalable architecture with a React TypeScript frontend and .NET Core backend.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile App    │    │  Admin Panel    │
│   (React SPA)   │    │   (Future)      │    │  (Future)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Load Balancer       │
                    │    (NGINX/CloudFlare)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Frontend Server      │
                    │   (Static Files)        │
                    └─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    API Gateway          │
                    │   (.NET Core Web API)   │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   Auth Service  │    │  Snack Service  │    │ Location Service│
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    PostgreSQL DB        │
                    │    with PostGIS         │
                    └─────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with component-based architecture
- **State Management**: React Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Maps**: Google Maps JavaScript API
- **Testing**: Vitest + Cypress
- **Accessibility**: WCAG 2.1 AA compliant

### Directory Structure
```
src/frontend/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── Common/           # Generic components
│   │   ├── Forms/            # Form components
│   │   ├── Layout/           # Layout components
│   │   ├── Map/              # Map-related components
│   │   └── Snacks/           # Snack-specific components
│   ├── context/              # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page components
│   ├── services/             # API services and utilities
│   ├── styles/               # SCSS stylesheets
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── test/                 # Test utilities and mocks
├── cypress/                  # E2E tests
└── scripts/                  # Build and utility scripts
```

### Component Architecture
```
App
├── AuthProvider
│   ├── Router
│   │   ├── Header
│   │   ├── Routes
│   │   │   ├── Home
│   │   │   │   ├── MapContainer
│   │   │   │   ├── FilterBar
│   │   │   │   └── SnackList
│   │   │   │       └── SnackCard[]
│   │   │   ├── AddSnack
│   │   │   │   ├── AddSnackForm
│   │   │   │   └── LocationPicker
│   │   │   ├── Login
│   │   │   └── Register
│   │   └── Footer
│   └── ErrorBoundary
```

### State Management
- **Authentication**: Global context with user state, tokens, and auth methods
- **Location**: Browser geolocation API with fallback
- **Snacks**: Local component state with API synchronization
- **UI State**: Component-level state for modals, forms, and interactions

## Backend Architecture

### Technology Stack
- **Framework**: .NET 9.0 Web API
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Documentation**: Swagger/OpenAPI
- **Security**: Custom middleware for rate limiting, validation, and headers

### Directory Structure
```
src/backend/SnackSpotAuckland.Api/
├── Controllers/               # API controllers
├── Data/                     # Database context and configurations
├── Filters/                  # Action filters and attributes
├── Middleware/               # Custom middleware components
├── Models/                   # Data models and DTOs
├── Services/                 # Business logic services
├── Migrations/               # EF Core migrations
└── Properties/               # Project configuration
```

### API Architecture
```
HTTP Request
│
├── SecurityHeadersMiddleware
├── ErrorHandlingMiddleware
├── RequestLoggingMiddleware
├── InputValidationMiddleware
├── RateLimitingMiddleware
│
├── Authentication/Authorization
│
├── Controller Action
│   ├── Model Validation
│   ├── Business Logic (Services)
│   └── Database Operations (EF Core)
│
└── HTTP Response
```

### Database Schema
```sql
-- Core entities
Users (id, username, email, password_hash, created_at)
Categories (id, name, description, icon)
Snacks (id, name, description, category_id, location, shop_name, created_by, created_at)
Reviews (id, snack_id, user_id, rating, comment, created_at)

-- Spatial data
Locations (PostGIS Point geometry for precise coordinates)

-- Authentication
RefreshTokens (id, user_id, token, expires_at, created_at)
```

## Security Architecture

### Authentication & Authorization
- JWT Bearer tokens for stateless authentication
- Refresh token rotation for security
- Role-based access control (future enhancement)
- Secure password hashing with BCrypt

### Security Middleware Stack
1. **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
2. **Request Logging**: Audit trail for security monitoring
3. **Input Validation**: XSS and injection prevention
4. **Rate Limiting**: DDoS protection and abuse prevention
5. **CORS**: Cross-origin request security

### Data Protection
- HTTPS enforcement in production
- SQL injection prevention via EF Core parameterization
- XSS protection through input validation and CSP
- CSRF protection via SameSite cookies and custom headers

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Automatic route-based and manual chunk splitting
- **Lazy Loading**: Components and images loaded on demand
- **Caching**: Service worker for static assets and API responses
- **Bundle Analysis**: Regular bundle size monitoring
- **Web Vitals**: Core Web Vitals tracking and optimization

### Backend Optimization
- **Database Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Spatial Queries**: PostGIS for efficient geospatial operations
- **Response Compression**: Gzip compression for API responses
- **Caching**: In-memory caching for frequently accessed data

### Monitoring & Observability
- **Performance Monitoring**: Custom Web Vitals tracking
- **Error Tracking**: Comprehensive error logging and reporting
- **Health Checks**: Automated system health monitoring
- **Accessibility Audits**: Automated WCAG 2.1 AA compliance checking

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Frontend (localhost:5173) - Vite dev server
├── Backend (localhost:5011) - .NET dev server
└── Database (localhost:5432) - PostgreSQL in Docker
```

### Production Environment (Future)
```
Cloud Infrastructure
├── CDN (CloudFlare)
├── Load Balancer
├── Frontend (Static hosting)
├── Backend (Container/VM)
├── Database (Managed PostgreSQL)
└── Monitoring (Application insights)
```

## Data Flow

### User Authentication Flow
```
1. User submits credentials
2. Backend validates against database
3. JWT tokens generated and returned
4. Frontend stores tokens securely
5. Subsequent requests include JWT header
6. Backend validates JWT on each request
7. Refresh tokens used for token renewal
```

### Snack Discovery Flow
```
1. User requests location permission
2. Frontend gets GPS coordinates
3. Coordinates sent to backend API
4. PostGIS spatial query finds nearby snacks
5. Results returned with distance calculations
6. Frontend displays snacks on map/list
7. User interactions tracked for analytics
```

### Snack Creation Flow
```
1. User fills out snack form
2. Location picker gets precise coordinates
3. Form validation on frontend and backend
4. Image upload (future enhancement)
5. Database record creation
6. Real-time updates to other users
7. Search index updates
```

## Accessibility Architecture

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Comprehensive ARIA implementation
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Touch Targets**: 44px minimum size on mobile
- **Focus Management**: Proper focus indicators and trapping
- **Semantic HTML**: Proper heading hierarchy and landmarks

### Assistive Technology Support
- **Screen Readers**: NVDA, JAWS, VoiceOver tested
- **Voice Control**: Dragon NaturallySpeaking compatible
- **Switch Navigation**: Sequential navigation support
- **High Contrast**: System preference detection
- **Reduced Motion**: Animation preference respect

## Future Enhancements

### Planned Features
- Mobile application (React Native)
- Real-time notifications (SignalR)
- Advanced search and filtering
- Social features (following, sharing)
- Gamification system (points, badges)
- Admin panel for content moderation
- Analytics dashboard
- Internationalization (i18n)

### Scalability Considerations
- Microservices architecture
- Event-driven architecture
- Horizontal scaling capabilities
- Caching layers (Redis)
- Message queuing (RabbitMQ/Azure Service Bus)
- Container orchestration (Kubernetes)

## Development Guidelines

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Comprehensive test coverage (>80%)
- Code review requirements
- Automated CI/CD pipelines
- Documentation requirements

### Performance Standards
- Lighthouse scores ≥90
- Core Web Vitals within thresholds
- Bundle size monitoring
- API response time <200ms
- Database query optimization
- Accessibility compliance testing

### Security Standards
- OWASP security guidelines
- Regular dependency updates
- Security scanning automation
- Penetration testing
- Data encryption at rest and in transit
- Privacy compliance (GDPR ready)

---

This architecture is designed to be scalable, maintainable, and accessible while providing an excellent user experience for discovering and sharing snacks in Auckland.