# GMATHS Platform - Setup Guide

## Overview
This guide covers the initial setup and development environment configuration for the GMATHS online testing platform.

## Prerequisites
- Node.js 18 or higher
- pnpm (package manager)
- PostgreSQL database
- Git

## Project Structure
The project uses a monorepo structure with pnpm workspaces:

```
gmaths-education-website/
├── backend/          # Fastify + TypeScript backend
├── frontend/         # Vite + React + TypeScript frontend
├── e2e/             # End-to-end tests
├── docs/            # Documentation
├── package.json     # Root workspace configuration
└── pnpm-workspace.yaml
```

## Development Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd gmaths-education-website
pnpm install
```

### 2. Environment Configuration
Create environment files (not included in repository):

**Backend (.env in backend/ directory):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gmaths_db"
JWT_SECRET="your-secure-jwt-secret"
PORT=3000
NODE_ENV=development
```

**Frontend (.env in frontend/ directory):**
```env
VITE_API_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Navigate to backend
cd backend

# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Optional: Open Prisma Studio
pnpm run db:studio
```

### 4. Development Servers

**Start backend (Terminal 1):**
```bash
cd backend
pnpm run dev
```

**Start frontend (Terminal 2):**
```bash
cd frontend  
pnpm run dev
```

## Available Scripts

### Root Level
- `pnpm install` - Install all dependencies
- `pnpm run dev` - Start both frontend and backend
- `pnpm run build` - Build both applications
- `pnpm run test` - Run all tests
- `pnpm run lint` - Lint all code

### Backend
- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run start` - Start production server
- `pnpm run test` - Run Jest tests
- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:migrate` - Run database migrations

### Frontend
- `pnpm run dev` - Start Vite development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run Vitest tests

## Health Check Endpoints

After starting the backend server:
- Health: `GET http://localhost:3000/health`
- API Health: `GET http://localhost:3000/api/health`

## Technology Stack

### Backend
- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM with PostgreSQL
- **Socket.io** - Real-time communication
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens
- **Zod** - Runtime type validation

### Frontend
- **Vite** - Fast build tool and development server
- **React 19** - UI library with modern features
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Vitest** - Testing framework

## Development Guidelines
- Follow the coding standards in `/docs/style-guide.md`
- Adhere to the important rules in `/.cursor/IMPORTANT.md`
- Use Vietnamese for all user-facing text
- Write JSDoc comments for non-trivial functions
- Use strict TypeScript configuration
- Test all new features before committing

## Next Steps
1. Complete AWS deployment pipeline (Step 0.2)
2. Begin Phase 1 development with authentication system
3. Follow the implementation plan in `/.cursor/implementation-plan.md` 