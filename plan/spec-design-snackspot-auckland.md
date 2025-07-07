---
title: Design Specification for SnackSpot Auckland Application
version: 1.0
date_created: 2025-07-08
last_updated: 2025-07-08
owner: SnackSpot Auckland Team
tags: [design, app, pwa, fullstack, accessibility, ai-ready]
---

# Introduction

This specification defines the requirements, constraints, and interfaces for the SnackSpot Auckland application—a gamified, community-driven PWA for discovering, sharing, and celebrating snacks in Auckland, New Zealand. The document is structured for effective use by Generative AIs and engineering teams.

## 1. Purpose & Scope

The purpose of this specification is to provide a clear, unambiguous reference for the design, development, and validation of the SnackSpot Auckland platform. It covers both frontend and backend, targeting developers, testers, architects, and stakeholders. Assumptions: Users have modern smartphones and internet access in Auckland.

## 2. Definitions

- **PWA**: Progressive Web Application
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **EF Core**: Entity Framework Core
- **WCAG**: Web Content Accessibility Guidelines
- **CI/CD**: Continuous Integration / Continuous Deployment
- **API**: Application Programming Interface
- **a11y**: Accessibility
- **Lighthouse**: Google tool for web performance and accessibility
- **SQL/NoSQL**: Structured/Unstructured database paradigms

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The frontend shall use React with TypeScript (JavaScript allowed with justification) and a styling library (e.g., MUI, Mantine, Tailwind) or custom styling, focusing on a visually appealing, responsive UI.
- **REQ-002**: The frontend must implement navigation using React Router or a similar routing library.
- **REQ-003**: The frontend must achieve Lighthouse scores ≥ 90 for performance and accessibility, and meet WCAG 2.1 AA.
- **REQ-004**: The frontend must support mobile, tablet, and desktop breakpoints unless explicitly approved. If not responsive, the README must justify why.
- **REQ-005**: The frontend must meet a11y requirements: semantic HTML, keyboard navigation, ARIA, color contrast, alt text, focus management, skip links, and accessible forms.
- **REQ-006**: The backend shall use C# with .NET 8+, Entity Framework Core, and an SQL or NoSQL database. Use SQL for core entities; NoSQL only with explicit justification. PostgreSQL with PostGIS is recommended for geospatial data.
- **REQ-007**: The backend must implement CRUD operations for all core entities (users, snacks, reviews, categories). Specify which entities support which operations (e.g., users: create, read, update self, soft-delete; snacks: full CRUD for owners/admins; reviews: create, read, update self, delete self/admin, or mark as hidden).
- **REQ-008**: Both frontend and backend must be deployed to a public endpoint with minimum 99% uptime, basic monitoring (health checks, error alerts), and documented rollback strategy.
- **REQ-009**: Both frontend and backend must use Git with a regular, meaningful commit history. Use a commit message convention and pre-commit hooks to ensure quality.
- **REQ-010**: All public API endpoints must be versioned (e.g., /api/v1/).
- **REQ-011**: The system shall provide an interactive map with custom snack pins and clustering.
- **REQ-012**: Users shall be able to search snacks by location, category, and tags.
- **REQ-013**: The system shall implement a gamified leveling and badge system.
- **REQ-014**: Users shall be able to share snacks via social media cards.
- **REQ-015**: The app shall support user-generated content and moderation.
- **SEC-001**: All authentication must use secure JWT tokens with refresh. Refresh tokens must be stored securely (httpOnly cookies) and rotated on use.
- **SEC-002**: Input validation and sanitization must be enforced on all endpoints. All critical validation and business logic must be enforced on the backend, regardless of frontend checks.
- **SEC-003**: Uploaded images must be virus-scanned and stored securely (e.g., S3/Cloudinary with AV scanning).
- **SEC-004**: API endpoints for scraping and public endpoints must be rate-limited and implement abuse prevention.
- **SEC-005**: All user data handling must comply with GDPR and NZ Privacy Act.
- **SEC-006**: All endpoints must enforce input validation and sanitization, with business logic enforced on backend.
- **SEC-007**: Implement abuse prevention and moderation endpoints.
- **PER-001**: Map load time < 3s on 3G; 100 pins render < 2s.
- **PER-002**: Image upload < 10s for 5MB files.
- **REL-001**: The system must support horizontal scaling and load balancing. Rollback procedures must be documented and tested.
- **OPX-001**: All resources must be tagged for cost/governance. Deployed services must have monitoring and alerting.
- **GUD-001**: Use Azure Well-Architected Framework pillars in design (Security, Operational Excellence, Performance Efficiency, Reliability, Cost Optimization).
- **GUD-002**: Use consistent naming conventions and resource abbreviations.
- **GUD-003**: Provide onboarding and clear user flows for first-time users.
- **GUD-004**: Use SQL for core entities; NoSQL only with explicit justification.
- **GUD-005**: Use a commit message convention and pre-commit hooks to ensure meaningful commit history.
- **GUD-006**: Provide clear documentation and onboarding flows.
- **CON-001**: Only users Level 2+ can create new categories.
- **CON-002**: User following is available at Level 3+.
- **PAT-001**: Use Instagram-style sharing cards for social features.

## 4. Interfaces & Data Contracts

### API Endpoints (examples)

- `GET /api/v1/snacks?lat={lat}&lng={lng}&radius={r}`: Returns snacks within radius.
- `POST /api/v1/snacks`: Add new snack (auth required).
- `GET /api/v1/categories`: List all categories.
- `POST /api/v1/ratings`: Submit rating and review.
- `GET /api/v1/users/{id}`: Get user profile and badges.

### Database Schema (excerpt)

```sql
-- Users Table
id UUID PRIMARY KEY
username VARCHAR UNIQUE
email VARCHAR UNIQUE
password_hash VARCHAR
level INT DEFAULT 1
experience_points INT DEFAULT 0
location POINT
created_at TIMESTAMP
updated_at TIMESTAMP

-- Snacks Table
id UUID PRIMARY KEY
name VARCHAR
description TEXT
category_id UUID
image_url VARCHAR
user_id UUID
location POINT
shop_name VARCHAR
shop_address VARCHAR
average_rating DECIMAL
total_ratings INT
created_at TIMESTAMP
data_source ENUM('user','scraped','seeded')
```

### Data Contracts (example)

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "category": "string",
  "imageUrl": "string",
  "location": { "lat": 0, "lng": 0 },
  "shopName": "string",
  "averageRating": 4.5,
  "tags": ["crunchy", "vegan"]
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a user in Auckland, when they open the app, then they see a map with snack pins within 2 seconds.
- **AC-002**: When a user submits a snack with a photo, the image is scanned and appears on the map within 10 seconds.
- **AC-003**: When a user completes level-up tasks, their level and unlocked area update immediately.
- **AC-004**: When a user shares a snack, a branded card is generated and shareable to Instagram.
- **AC-005**: When inappropriate content is reported, it is hidden from public view within 1 hour.
- **AC-006**: All API endpoints must reject invalid or malicious input.
- **AC-007**: Given a user with a screen reader, all navigation and forms are fully accessible.
- **AC-008**: Given a malformed request or invalid JWT, the API returns a clear error (400/401/403).

## 6. Test Automation Strategy

- **Test Levels**: Unit (React components, API logic), Integration (API + DB), End-to-End (user flows)
- **Frameworks**: Jest, React Testing Library, Supertest, Cypress
- **Test Data Management**: Use seed scripts and isolated test DBs; cleanup after each run
- **CI/CD Integration**: Automated tests run on every PR via GitHub Actions
- **Coverage Requirements**: 90%+ for core logic, 80%+ overall for both frontend and backend
- **Performance Testing**: Use Lighthouse and custom scripts for load testing map and API
- **Security Testing**: Automated tests for JWT, input sanitization, rate limiting, and abuse prevention
- **Manual Review**: Onboarding, leveling, sharing flows, and accessibility (a11y)
- **Compliance Testing**: Privacy and data handling checks

## 7. Rationale & Context

- Gamification and social sharing drive engagement and organic growth.
- Map-based discovery leverages geospatial data for local relevance.
- Progressive unlocking and badges incentivize continued use.
- PWA ensures accessibility and installability without app stores.
- Security, privacy, and moderation are prioritized to protect users and content.
- Accessibility and inclusivity are core to the user experience.
- Cloud-native architecture and Azure Well-Architected Framework pillars guide all design and implementation decisions.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Google Maps Platform – Map rendering and geolocation
- **EXT-002**: AWS S3 – Image storage
- **EXT-003**: Cloudinary – Image optimization and CDN
- **EXT-004**: Firebase Cloud Messaging – Push notifications

### Third-Party Services

- **SVC-001**: Google Analytics 4 – Analytics and usage tracking
- **SVC-002**: Sentry – Error tracking

### Infrastructure Dependencies

- **INF-001**: PostgreSQL with PostGIS – Geospatial data storage
- **INF-002**: Redis – Caching for performance
- **INF-003**: Load balancer – Horizontal scaling

### Data Dependencies

- **DAT-001**: NZ supermarket websites – Snack data scraping

### Technology Platform Dependencies

- **PLT-001**: Node.js 18+ (for frontend tooling), React 18+, Tailwind CSS, Vite
- **PLT-002**: .NET 8+, Entity Framework Core, SQL/NoSQL database

### Compliance Dependencies

- **COM-001**: GDPR/Privacy Act compliance for user data

## 9. Examples & Edge Cases

```json
// Example: Snack with multiple tags and user-generated category
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Vegan Chocolate Croissant",
  "category": "Vegan Snacks",
  "tags": ["vegan", "sweet", "morning-boost"],
  "location": { "lat": -36.8485, "lng": 174.7633 },
  "imageUrl": "https://cdn.cloudinary.com/snackspot/vegan-croissant.jpg"
}
```

**Edge Cases:**

- User attempts to upload a 20MB image (should be rejected)
- User tries to create a new category at Level 1 (should be denied)
- Invalid JWT provided (should return 401 Unauthorized)
- Malformed request body (should return 400 Bad Request)
- User attempts to access another user's private data (should return 403 Forbidden)
- Cloud service misconfiguration (e.g., S3/Cloudinary, database, monitoring)
- Cost overruns due to unoptimized cloud resource usage
- Data privacy or compliance gaps

## 10. Validation Criteria

- All requirements and acceptance criteria are covered by automated tests.
- Security tests validate JWT, input sanitization, and rate limiting.
- Performance tests confirm map and image load times.
- Manual review confirms onboarding, leveling, sharing flows, and accessibility (a11y).
- Compliance checks for privacy and data handling.

## 11. Related Specifications / Further Reading

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [.NET 8 Documentation](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)
- [Entity Framework Core Docs](https://learn.microsoft.com/en-us/ef/core/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs/installation)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
