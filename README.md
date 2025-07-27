# SnackSpot Auckland - Community Food Discovery Network

A gamified, community-driven platform for discovering and sharing snacks in Auckland, New Zealand.

## 🌐 Theme: Networking

SnackSpot Auckland embodies the **"Networking"** theme through:

- **Community Building**: Users connect over shared food experiences and local discoveries
- **Social Interactions**: Review system creates conversations and recommendations between users  
- **Local Business Networking**: Connects people to local businesses and fellow food enthusiasts in Auckland
- **Knowledge Sharing**: Users share insider knowledge about hidden gems and local favorites
- **Profile-Based Connections**: User profiles allow discovering others with similar taste preferences
- **Geographic Social Discovery**: Location-based features help users network with others in their area

This creates a food-focused social network that brings Auckland's community together through shared culinary experiences.

## ✨ Features

### Core Functionality
- 🗺️ **Interactive Map**: Discover snacks using Google Maps integration with clustering
- 🏪 **Store Integration**: Snacks are associated with specific stores rather than just coordinates
- 👤 **User Profiles**: Personal pages with Instagram handles, bios, and shared snacks
- ⭐ **Review System**: Rate and review snacks to help the community
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices

### Advanced Features Implemented

#### 1. **Unit Testing Components** ✅
- Component tests for UI elements (SnackCard, LoadingSpinner, AuthContext)
- API service tests for backend integration
- Test coverage for critical user flows

#### 2. **End-to-End Testing using Cypress** ✅
- Automated E2E tests for user authentication
- Accessibility testing with automated audits
- Full user journey testing from registration to snack discovery

#### 3. **Theme Switching (Light/Dark Mode)** ✅
- System preference detection for automatic theme selection
- Manual theme toggle for user preference
- Consistent theming across all components and pages
- Accessibility-compliant theme switching with proper ARIA labels

## 🛠️ Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **React Router** for navigation
- **SCSS** for styling with custom responsive design
- **Google Maps API** for interactive mapping
- **Axios** for API communication
- **React Hook Form** with Zod validation

### Backend
- **.NET 9** with **C# 12**
- **Entity Framework Core** with PostgreSQL
- **PostGIS** for geospatial data
- **JWT Authentication** with refresh tokens
- **Comprehensive middleware** (rate limiting, validation, security headers)

### Testing & Quality
- **Vitest** for frontend unit testing
- **Cypress** for E2E testing
- **xUnit** for backend unit testing
- **ESLint & Prettier** for code quality
- **Lighthouse** for performance auditing

### Infrastructure
- **GitHub Actions** for CI/CD
- **PostgreSQL** with PostGIS extension
- **Deployed frontend and backend** (production ready)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- .NET 8+
- PostgreSQL with PostGIS

### Quick Start
```bash
# Clone the repository
git clone [your-repo-url]
cd Snackwork

# Start development environment
./start-dev.sh
```

### Manual Setup
```bash
# Frontend
cd src/frontend
npm install
npm run dev

# Backend
cd src/backend/SnackSpotAuckland.Api
dotnet restore
dotnet run
```

## 🧪 Testing

```bash
# Frontend tests
cd src/frontend
npm run test              # Unit tests
npm run test:e2e         # Cypress E2E tests
npm run test:coverage    # Coverage report

# Backend tests
cd src/backend/SnackSpotAuckland.Tests
dotnet test
```

## 📱 Responsive Design

The application is fully responsive and provides an optimal experience on:
- **Desktop**: Full-featured interface with comprehensive map and list views
- **Mobile**: Touch-optimized interface with mobile-first design principles
- **Tablet**: Adaptive layout that scales appropriately

## ♿ Accessibility

- **WCAG 2.1 AA compliant**
- **Keyboard navigation** support
- **Screen reader** optimization
- **High contrast** support
- **Focus management** and proper ARIA labeling

## 🔐 Security

- JWT authentication with secure refresh tokens
- Input validation and sanitization
- Rate limiting and abuse prevention
- CORS policies and security headers
- SQL injection protection via EF Core

## 📚 Architecture

Detailed architecture documentation available in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the MSA Phase 2 assessment.

## 🎯 Assessment Requirements

### Basic Requirements ✅
- [x] React with TypeScript frontend
- [x] Visually appealing and responsive UI
- [x] React Router navigation
- [x] C# .NET backend with Entity Framework Core
- [x] SQL database with CRUD operations
- [x] Clear Git commit history
- [x] Deployed frontend and backend

### Advanced Requirements ✅
- [x] **Unit testing components** - Comprehensive test suite with Vitest
- [x] **End-to-end testing using Cypress** - Full user journey automation
- [x] **Theme switching (light/dark mode)** - System and manual theme selection

---

*Connecting Auckland's food lovers, one snack at a time! 🍪* 