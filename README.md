# GMATHS Education Online Testing Platform

A comprehensive, full-stack web application for conducting secure online mathematics and STEAM subject examinations with Vietnamese UI support.

## Overview

GMATHS Education Platform is a modern, scalable online testing system designed specifically for mathematics education. Built with real-time capabilities, anti-cheating measures, and support for LaTeX mathematical notation, it provides a robust solution for conducting secure online exams with up to 1,500 concurrent users.

## Key Features

### Core Functionality
- **Secure Authentication** - JWT-based authentication with role-based access control (Student, Admin, Teacher)
- **Flexible Exam Management** - Create, schedule, and manage exams with configurable time windows
- **Advanced Question Types** - Multiple choice, true/false, fill-in-blank, short answer with LaTeX/MathQuill support
- **Real-time Exam Delivery** - WebSocket-synchronized countdown timers with automatic polling fallback
- **Auto-save & Auto-submit** - Answer preservation every 10 seconds with automatic submission on timeout
- **Instant Grading** - Automatic grading for objective questions with detailed analytics
- **Leaderboards** - Post-exam rankings by score and completion time

### Administrative Features
- **Bulk User Management** - CSV-based import/export for users and questions
- **Result Analytics** - Comprehensive per-exam and per-question statistics
- **Manual Grading Queue** - System for reviewing subjective answers
- **Content Management** - Post creation and mailing list features for teacher announcements

### Anti-Cheating Measures
- Full-screen mode enforcement
- Copy-paste restrictions
- Tab-switch detection and logging
- Single device enforcement
- Optional AI webcam monitoring (face count, head movement detection)
- Question randomization per student
- Activity logging for proctoring review

### Internationalization
- Complete Vietnamese UI localization with proper diacritics
- LaTeX and MathJax support for mathematical notation
- MathLive and MathQuill for rich mathematical input

## Technology Stack

### Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Fastify 5.3.3
- **Language:** TypeScript 5.8.3
- **Database:** PostgreSQL 16.x with Prisma ORM 6.8.2
- **Cache/Sessions:** Redis 7.2.x
- **Real-time:** Socket.io 4.8.1 with Redis adapter
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** Zod 4.0.17
- **Testing:** Jest 29.7.0

### Frontend
- **Framework:** React 19.1.0
- **Build Tool:** Vite 6.3.5
- **Language:** TypeScript 5.8.3
- **Styling:** Tailwind CSS 4.1.8
- **State Management:** TanStack React Query 5.77.2
- **Routing:** React Router DOM 7.6.1
- **Forms:** React Hook Form 7.56.4 + Zod validation
- **Math Rendering:** KaTeX 0.16.22, MathLive 0.105.3, MathQuill 0.10.1-a
- **UI Components:** Headless UI 2.2.4
- **Drag & Drop:** @dnd-kit suite
- **Testing:** Vitest 3.1.4 + Testing Library

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Package Manager:** pnpm 10.11.0 (monorepo workspaces)
- **Process Management:** PM2 for production
- **Reverse Proxy:** Nginx
- **Cloud Platform:** AWS EC2
- **Email Service:** AWS SES SDK v3

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x LTS or higher
- **pnpm** 10.x or higher
- **PostgreSQL** 16.x or higher (or use Docker)
- **Redis** 7.x or higher (or use Docker)
- **Docker & Docker Compose** (optional, for containerized development)
- **Git** for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gmaths-education-website
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Database Services with Docker

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify services are running
docker-compose ps
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 4. Configure Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://gmaths_user:gmaths_password_dev@localhost:5432/gmaths_database"
JWT_SECRET="your-secure-random-jwt-secret-key-here"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

### 5. Set Up the Database

```bash
cd backend

# Generate Prisma Client
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# Optional: Seed the database with initial data
pnpm run db:seed

# Optional: Open Prisma Studio to view your database
pnpm run db:studio
```

### 6. Start Development Servers

**Option A: Start both servers in parallel (recommended)**
```bash
# From the root directory
pnpm run dev
```

**Option B: Start servers individually**
```bash
# Terminal 1 - Backend
cd backend
pnpm run dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/documentation

## Project Structure

```
gmaths-education-website/
├── backend/                    # Fastify + TypeScript backend
│   ├── src/
│   │   ├── server.ts          # Application entry point
│   │   ├── app.ts             # Fastify app configuration
│   │   ├── routes/            # API endpoint definitions
│   │   ├── services/          # Business logic layer
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   └── seed.ts            # Database seeding
│   └── tests/                 # Jest test suites
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API client functions
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Application entry point
│   └── public/                # Static assets
│
├── e2e/                       # End-to-end tests (Playwright)
├── docs/                      # Project documentation
│   ├── setup.md               # Detailed setup guide
│   ├── deployment.md          # Deployment instructions
│   ├── questions.md           # Question types documentation
│   └── session-based-exam-system.md
│
├── .cursor/                   # Development guidelines
│   ├── tech-stack.md
│   ├── product-requirements.md
│   ├── implementation-plan.md
│   ├── style-guide.md
│   └── IMPORTANT.md           # Critical coding rules
│
├── deploy/                    # Deployment configurations
├── bruno/                     # API testing collections
├── docker-compose.yml         # Local development containers
├── pnpm-workspace.yaml        # Monorepo workspace config
└── package.json               # Root package configuration
```

## Available Scripts

### Root Level Commands

```bash
pnpm install          # Install all dependencies
pnpm run dev          # Start both frontend and backend concurrently
pnpm run build        # Build both applications for production
pnpm run test         # Run all test suites
pnpm run lint         # Lint all code
pnpm run type-check   # Type-check all TypeScript code
pnpm run clean        # Clean all build artifacts
```

### Backend Commands

```bash
cd backend

pnpm run dev          # Start development server with hot reload
pnpm run build        # Compile TypeScript to JavaScript
pnpm run start        # Start production server
pnpm run start:prod   # Start with NODE_ENV=production
pnpm run test         # Run Jest tests
pnpm run test:watch   # Run tests in watch mode

# Database commands
pnpm run db:generate     # Generate Prisma Client
pnpm run db:migrate      # Run database migrations
pnpm run db:migrate:prod # Run migrations in production
pnpm run db:push         # Push schema changes without migrations
pnpm run db:studio       # Open Prisma Studio GUI
pnpm run db:seed         # Seed database with initial data
```

### Frontend Commands

```bash
cd frontend

pnpm run dev       # Start Vite development server
pnpm run build     # Build for production
pnpm run preview   # Preview production build locally
pnpm run lint      # Lint frontend code
```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm run test

# Backend tests only
cd backend && pnpm run test

# Frontend tests only
cd frontend && pnpm run test

# Run tests in watch mode
cd backend && pnpm run test:watch
```

### Code Quality

```bash
# Lint all code
pnpm run lint

# Type-check
pnpm run type-check

# Format code (if Prettier is configured)
pnpm run format
```

### Database Management

```bash
# View database in Prisma Studio
cd backend && pnpm run db:studio

# Create a new migration
cd backend && pnpm run db:migrate

# Reset database (warning: deletes all data)
cd backend && npx prisma migrate reset
```

## API Documentation

Once the backend server is running, interactive API documentation is available at:

- **Swagger UI:** http://localhost:3000/documentation

## Health Check Endpoints

Verify that the backend is running properly:

```bash
# Basic health check
curl http://localhost:3000/health

# API health check
curl http://localhost:3000/api/health
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guide](docs/setup.md)** - Detailed installation and configuration
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- **[Questions Documentation](docs/questions.md)** - Question types and formats
- **[Session System](docs/session-based-exam-system.md)** - Exam session architecture
- **[UI Components](docs/ui-components.md)** - Component library documentation

### Development Guidelines

- **[Tech Stack](/.cursor/tech-stack.md)** - Technology decisions and rationale
- **[Product Requirements](/.cursor/product-requirements.md)** - Feature specifications
- **[Implementation Plan](/.cursor/implementation-plan.md)** - Development roadmap
- **[Style Guide](/.cursor/style-guide.md)** - Code style and conventions
- **[Important Rules](/.cursor/IMPORTANT.md)** - Critical coding standards

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | - | Yes |
| `PORT` | Backend server port | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `CORS_ORIGIN` | Allowed CORS origins | - | Yes |
| `REDIS_HOST` | Redis server host | localhost | No |
| `REDIS_PORT` | Redis server port | 6379 | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | - | Yes |

## Performance Considerations

The platform is optimized to support **1,500 concurrent users** with:

- Redis caching for session management and real-time data
- Database connection pooling
- Optimized database queries with proper indexing
- WebSocket connection management with fallback polling
- Server-authoritative timer synchronization
- Efficient JSON-based question storage

## Security Features

- **Password Security:** bcrypt hashing with configurable rounds
- **JWT Authentication:** Secure token-based authentication with refresh tokens
- **Input Validation:** Zod schema validation on all API endpoints
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **XSS Protection:** Sanitized user inputs and CSP headers
- **Rate Limiting:** Fastify rate-limit plugin
- **CORS Configuration:** Strict origin policies
- **Session Management:** Redis-backed session storage with expiration

## Browser Support

The frontend is optimized for modern browsers:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Contributing

1. Follow the coding standards in `docs/style-guide.md`
2. Adhere to the critical rules in `.cursor/IMPORTANT.md`
3. Use Vietnamese for all user-facing text
4. Write tests for new features
5. Ensure TypeScript strict mode compliance
6. Add JSDoc comments for non-trivial functions

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart database services
docker-compose restart postgres redis
```

### Port Already in Use

```bash
# Find and kill process using port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Find and kill process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Prisma Client Issues

```bash
cd backend
pnpm run db:generate
```

### Clear All Data and Restart

```bash
# Stop containers and remove volumes
docker-compose down -v

# Restart containers
docker-compose up -d

# Rerun migrations
cd backend && pnpm run db:migrate
```

## License

UNLICENSED - Proprietary software for GMATHS Education

## Author

**GMATHS Education** - Vietnamese mathematics and STEAM education platform

---

For additional support or questions, please refer to the documentation in the `docs/` directory or contact the development team.
