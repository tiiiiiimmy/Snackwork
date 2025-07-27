# SnackSpot Auckland - Community Food Discovery Network

A gamified, community-driven platform for discovering and sharing snacks in Auckland, New Zealand.

## 🎥 Project Demonstration Video

> **📹 [Watch the 5-minute project demo video here](https://your-video-link-here)**
> 
> *Please upload your video to YouTube, Vimeo, or OneDrive and replace the link above*

### Video Content Overview:
The demonstration video covers:
- **Project Introduction** (0:00-1:00): Overview of SnackSpot Auckland and its purpose
- **Unique Features Showcase** (1:00-3:00): Highlighting what makes this project special
- **Advanced Features Demo** (3:00-4:30): Live demonstration of implemented advanced features
- **Technical Architecture** (4:30-5:00): Brief overview of the tech stack and deployment

---

## 🌟 What Makes SnackSpot Auckland Unique

### 🎯 **Community-Driven Food Discovery Network**
Unlike generic food apps, SnackSpot Auckland creates a **social network specifically for snacks** in Auckland, fostering genuine community connections through shared food experiences.

### 🗺️ **Geospatial-First Architecture** 
Built with **PostGIS and advanced location intelligence**, featuring smart clustering, radius-based discovery, and location-aware recommendations that traditional food apps lack.

### 🎮 **Gamification with Purpose**
Implementing **user levels, experience points, and achievement systems** that encourage exploration of Auckland's diverse food scene while building community engagement.

### 🏪 **Store-Centric Approach**
Snacks are tied to **specific local businesses**, promoting Auckland's small business ecosystem rather than just generic locations.

### 🛡️ **Enterprise-Grade Security**
Comprehensive security implementation with **JWT refresh tokens, rate limiting, input validation, and GDPR compliance** - exceeding typical student project security standards.

### ♿ **Accessibility Excellence**
**WCAG 2.1 AA compliant** with comprehensive keyboard navigation, screen reader support, and automated accessibility testing - demonstrating inclusive design principles.

---

## ✅ Advanced Features Checklist

> **⚠️ Important**: Only features explicitly listed below will be considered for marking.

### 🧪 **1. Unit Testing Components** ✅
- **Frontend Testing Suite**:
  - ✅ Component tests using **Vitest** and **React Testing Library**
  - ✅ UI component tests (SnackCard, LoadingSpinner, ThemeToggle)
  - ✅ Context testing (AuthContext with authentication flows)
  - ✅ API service tests with **MSW (Mock Service Worker)**
  - ✅ Test coverage reporting with detailed metrics
  - ✅ Accessibility unit tests integrated into component tests

- **Backend Testing Suite**:
  - ✅ **xUnit** test framework for .NET Core
  - ✅ Controller unit tests with dependency injection
  - ✅ Service layer testing (AuthService, business logic)
  - ✅ Repository pattern testing with **in-memory database**
  - ✅ Test fixtures and helper classes for consistent testing
  - ✅ Integration tests with **WebApplicationFactory**

### 🤖 **2. End-to-End Testing using Cypress** ✅
- **Comprehensive E2E Test Suite**:
  - ✅ **User authentication flows** (login, register, logout)
  - ✅ **Snack discovery journey** (search, filter, view details)
  - ✅ **CRUD operations** (create, edit, delete snacks and reviews)
  - ✅ **Map interactions** and location-based features
  - ✅ **Mobile responsive testing** across different viewports
  - ✅ **Cross-browser compatibility** testing

- **Automated Accessibility Testing**:
  - ✅ **Keyboard navigation** testing throughout the application
  - ✅ **Screen reader compatibility** verification
  - ✅ **Color contrast** and visual accessibility checks
  - ✅ **Touch target sizing** validation (44px minimum)
  - ✅ **Focus management** and ARIA label testing
  - ✅ **Automated accessibility audits** in CI/CD pipeline

### 🌓 **3. Theme Switching (Light/Dark Mode)** ✅
- **Advanced Theme System**:
  - ✅ **System preference detection** with `prefers-color-scheme`
  - ✅ **Manual theme toggle** with persistent user preference
  - ✅ **Smooth transitions** between themes without flash
  - ✅ **Context-based theme management** using React Context
  - ✅ **SCSS custom properties** for dynamic theming
  - ✅ **Accessibility-compliant** theme switching with proper ARIA labels
  - ✅ **High contrast mode support** for accessibility
  - ✅ **Theme state persistence** across browser sessions

---

## 🛠️ Technology Stack

### Frontend Architecture
- **React 19** with **TypeScript** for type safety
- **React Router 7** for client-side routing
- **SCSS** with advanced mixins and responsive design
- **Google Maps JavaScript API** with clustering
- **Axios** with interceptors for API communication
- **React Hook Form** + **Zod** for form validation
- **Vite** for modern build tooling and HMR

### Backend Architecture  
- **.NET 9** with **C# 12** and minimal APIs
- **Entity Framework Core** with **PostgreSQL**
- **PostGIS** extension for geospatial operations
- **JWT Authentication** with secure refresh token rotation
- **Comprehensive middleware stack** (detailed below)
- **Swagger/OpenAPI** for API documentation
- **Health checks** and monitoring endpoints

### Advanced Middleware Stack
- ✅ **Rate Limiting Middleware**: Prevents API abuse with endpoint-specific limits
- ✅ **Input Validation Middleware**: SQL injection prevention and request sanitization  
- ✅ **Security Headers Middleware**: CSP, HSTS, X-Frame-Options implementation
- ✅ **Request Logging Middleware**: Structured logging with PII redaction
- ✅ **Error Handling Middleware**: Global exception handling with proper HTTP status codes

### Testing & Quality Assurance
- **Vitest** + **React Testing Library** for frontend unit tests
- **Cypress** for E2E testing with accessibility audits
- **xUnit** for backend unit and integration tests
- **MSW** for API mocking in tests
- **ESLint** + **TypeScript** for code quality
- **Lighthouse** integration for performance auditing

### DevOps & Deployment
- **GitHub Actions** CI/CD with automated testing
- **Azure Static Web Apps** for frontend deployment
- **Azure App Service** for backend deployment
- **PostgreSQL** with **PostGIS** on Azure Database
- **Environment-based configuration** with secure secret management

---

## 🌐 Theme: Networking

SnackSpot Auckland embodies the **"Networking"** theme through:

- **Community Building**: Users connect over shared food experiences and local discoveries
- **Social Interactions**: Review system creates conversations and recommendations between users  
- **Local Business Networking**: Connects people to local businesses and fellow food enthusiasts in Auckland
- **Knowledge Sharing**: Users share insider knowledge about hidden gems and local favorites
- **Profile-Based Connections**: User profiles allow discovering others with similar taste preferences
- **Geographic Social Discovery**: Location-based features help users network with others in their area

This creates a food-focused social network that brings Auckland's community together through shared culinary experiences.

---

## ✨ Core Features

### User Experience
- 🗺️ **Interactive Map**: Google Maps integration with marker clustering and geospatial search
- 🏪 **Store Integration**: Snacks associated with specific Auckland businesses
- 👤 **User Profiles**: Personal pages with Instagram handles, bios, and contribution history
- ⭐ **Review System**: Community-driven ratings and detailed reviews
- 📱 **Progressive Web App**: Installable, offline-capable mobile experience
- 🔍 **Advanced Search**: Filter by category, rating, distance, and price range

### Technical Excellence
- 🛡️ **Enterprise Security**: JWT with refresh tokens, rate limiting, input validation
- ♿ **Accessibility First**: WCAG 2.1 AA compliant with comprehensive keyboard navigation
- 🎨 **Modern UI/UX**: Responsive design with smooth animations and micro-interactions
- 🚀 **Performance Optimized**: Lighthouse scores >90, lazy loading, code splitting
- 🧪 **Test Coverage**: Unit, integration, and E2E tests with automated accessibility audits

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (specified in `.nvmrc`)
- **.NET 9 SDK**
- **PostgreSQL 14+** with **PostGIS** extension
- **Google Maps API Key**

### Quick Start
```bash
# Clone and setup
git clone [your-repo-url]
cd Snackwork
./start-dev.sh  # Automated setup script
```

### Manual Setup
```bash
# Backend Setup
cd src/backend/SnackSpotAuckland.Api
cp appsettings.example.json appsettings.json
# Configure your database connection and JWT secret
dotnet restore
dotnet ef database update
dotnet run

# Frontend Setup  
cd src/frontend
npm install
npm run dev
```

---

## 🧪 Testing Commands

```bash
# Frontend Testing
cd src/frontend
npm run test              # Unit tests with Vitest
npm run test:coverage     # Coverage report
npm run test:e2e         # Cypress E2E tests
npm run test:accessibility # Accessibility audit

# Backend Testing
cd src/backend/SnackSpotAuckland.Tests
dotnet test              # Unit and integration tests
dotnet test --collect:"XPlat Code Coverage"  # With coverage
```

---

## 📊 Quality Metrics

### Performance Benchmarks
- **Lighthouse Performance**: >90
- **Lighthouse Accessibility**: >90
- **First Contentful Paint**: <1.8s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

### Test Coverage Targets
- **Frontend Unit Tests**: >80% coverage
- **Backend Unit Tests**: >85% coverage
- **E2E Test Coverage**: All critical user journeys
- **Accessibility Tests**: 100% of interactive components

---

## 🔐 Security Implementation

### Authentication & Authorization
- ✅ **JWT Access Tokens** (15-minute expiry)
- ✅ **Secure Refresh Tokens** (30-day expiry with rotation)
- ✅ **Password hashing** with BCrypt
- ✅ **Role-based access control**

### API Security
- ✅ **Rate limiting** (endpoint-specific limits)
- ✅ **Input validation** and sanitization
- ✅ **SQL injection prevention** via EF Core
- ✅ **CORS policy** configuration
- ✅ **Security headers** (CSP, HSTS, X-Frame-Options)

### Data Protection
- ✅ **Environment variable** configuration
- ✅ **Sensitive data masking** in logs
- ✅ **HTTPS enforcement**
- ✅ **Database connection encryption**

---

## 📚 Documentation

- 📋 **API Documentation**: Available at `/swagger` endpoint
- 🏗️ **Architecture Guide**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 📝 **Development Setup**: [`scripts/developer-setup.sh`](scripts/developer-setup.sh)
- 🎯 **Feature Specifications**: [`plan/`](plan/) directory

---

## 🎯 Assessment Compliance

### ✅ Basic Requirements Met
- [x] **React with TypeScript** frontend
- [x] **Visually appealing and responsive** UI design
- [x] **React Router** navigation implementation
- [x] **C# .NET backend** with Entity Framework Core
- [x] **SQL database** with full CRUD operations
- [x] **Clear Git commit history** with meaningful messages
- [x] **Deployed frontend and backend** with public URLs

### ✅ Advanced Requirements Implemented
- [x] **Unit testing components** - Comprehensive test suites (Frontend: Vitest, Backend: xUnit)
- [x] **End-to-end testing using Cypress** - Full user journey automation with accessibility testing
- [x] **Theme switching (light/dark mode)** - System preference detection with manual override

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run ci` for frontend, `dotnet test` for backend)
4. Commit changes with meaningful messages
5. Push to branch and open a Pull Request

---

## 📄 License

This project is part of the **MSA Phase 2 assessment** and demonstrates advanced full-stack development capabilities with modern web technologies.

---

*🍪 Connecting Auckland's food lovers, one snack at a time!*

**Live Application**: [Frontend URL] | [Backend API URL]  
**Repository**: [GitHub Repository URL] 