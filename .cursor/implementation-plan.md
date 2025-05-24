# GMATHS Online Testing Platform Implementation Plan

## Project Structure and Initial Setup

**Monorepo Structure:** Strict project structure enforced from day one:

```
gmaths-education-website/
├── backend/               # Fastify server (Node.js/TypeScript)
│   ├── package.json       # Backend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for backend
│   ├── src/               # Source code for Fastify server
│   │   ├── routes/        # Route definitions (auth, exams, websocket)
│   │   ├── plugins/       # Fastify plugins (auth, Prisma, websocket)
│   │   ├── services/      # Business logic (auth, grading, timer sync)
│   │   ├── models/        # Data models and interfaces
│   │   ├── utils/         # Utility modules (validators, helpers)
│   │   └── websocket/     # WebSocket handlers and Redis pub/sub
│   ├── prisma/            # Prisma schema and migration files
│   │   └── schema.prisma  # Data model definitions (User, Exam, Session)
│   ├── tests/             # Backend unit/integration tests (Vitest)
│   └── .env               # Environment variables (DB URL, JWT secret, Redis URL)
├── frontend/              # Vite + React frontend (TypeScript)
│   ├── package.json       # Frontend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for frontend
│   ├── vite.config.ts     # Vite configuration (including test config)
│   ├── src/               # React application source
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Vietnamese UI)
│   │   ├── api/           # API interaction layer
│   │   ├── websocket/     # WebSocket client and timer sync
│   │   ├── types/         # Shared TypeScript interfaces
│   │   └── App.tsx        # Application root
│   ├── tests/             # Frontend unit tests (Vitest + Testing Library)
│   └── public/            # Static assets
├── e2e/                   # End-to-end tests (Playwright)
│   └── tests/             # Playwright test specs for user flows
├── docs/                  # Documentation (MarkDown)
│   ├── README.md          # Project overview
│   ├── architecture.md    # Architecture decisions
│   ├── auth.md            # Authentication documentation
│   ├── exams.md           # Exam system documentation
│   ├── websocket.md       # Real-time features documentation
│   ├── deployment.md      # AWS deployment guide
│   └── ...                # Additional docs for features, API reference, etc.
├── package.json           # Root workspace config
└── .github/               # CI/CD workflows
    └── workflows/ci-cd.yml
```

**Initial Setup Steps:**

1. **Backend Initialization:**
   ```bash
   cd backend
   npm init -y
   npm install fastify @fastify/cors @fastify/jwt @fastify/cookie @fastify/websocket @fastify/static @fastify/formbody
   npm install prisma @prisma/client bcrypt jsonwebtoken zod helmet pino bullmq redis
   npm install -D typescript tsx @types/node @types/bcrypt @types/jsonwebtoken vitest
   npx tsc --init
   npx prisma init --datasource-provider postgresql
   ```

2. **Frontend Initialization:**
   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install @tanstack/react-query socket.io-client mathjax-full
   npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
   ```

3. **Redis Setup:**
   ```bash
   # Local development
   docker run --name redis -p 6379:6379 -d redis:7.2-alpine
   ```

## Phase-Based Development Strategy

### Phase 1: Foundation & Core Architecture

**Database Schema Design:**
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         String   @default("student")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  createdExams Exam[]   @relation("ExamCreator")
  sessions     ExamSession[]
}

model Exam {
  id          String   @id @default(uuid())
  title       String
  description String?
  creator     User     @relation("ExamCreator", fields: [creatorId], references: [id])
  creatorId   String
  questionsData Json   // Flexible JSON storage for questions
  settings    Json     // Exam settings (time limit, attempts, etc.)
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  sessions    ExamSession[]
}

model ExamSession {
  id          String   @id @default(uuid())
  exam        Exam     @relation(fields: [examId], references: [id])
  examId      String
  student     User     @relation(fields: [studentId], references: [id])
  studentId   String
  answers     Json?    // Student answers
  score       Float?
  timeRemaining Int?   // Seconds remaining
  status      String   @default("in_progress") // in_progress, completed, expired
  startedAt   DateTime @default(now())
  submittedAt DateTime?
  
  @@unique([examId, studentId]) // One session per student per exam
}
```

**Question Type Interfaces:**
```typescript
// Extensible question type system
interface BaseQuestion {
  id: string;
  type: QuestionType;
  content: string; // LaTeX-enabled content
  points: number;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  maxLength?: number;
}

interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank';
  acceptedAnswers: string[];
  caseSensitive?: boolean;
}

type Question = MultipleChoiceQuestion | EssayQuestion | FillBlankQuestion;

interface ExamData {
  questions: Question[];
  settings: {
    timeLimit?: number; // minutes
    maxAttempts: number;
    shuffleQuestions: boolean;
    showResultsImmediately: boolean;
  };
}
```

**Authentication System:**
- JWT tokens with 1-hour expiration
- Redis-stored refresh tokens (7-day expiration)
- Hybrid session management for performance
- Vietnamese UI with bcrypt password hashing

**WebSocket Infrastructure:**
- Socket.io with Redis adapter for scaling
- Timer synchronization with 1-second precision
- Polling fallback every 5 seconds on disconnect
- Auto-reconnection with state restoration

### Phase 2: Exam Management & Question System

**Admin Exam Creation:**
- JSON-based question storage with TypeScript validation
- MathJax integration for LaTeX rendering
- Vietnamese admin interface
- Real-time preview of questions
- Extensible question type system

**Question Validation:**
- Frontend: Form validation and LaTeX preview
- Backend: Zod schema validation for question data
- Both: Content length limits and required field checks

**Features:**
- Drag-and-drop question reordering
- Question bank with categorization
- Bulk import/export functionality
- Version control for exam changes

### Phase 3: Exam Taking & Real-time Features

**Student Exam Interface:**
- Vietnamese UI with clear instructions
- WebSocket-synchronized countdown timer
- Auto-save every 10 seconds
- MathJax rendering for question content
- Responsive design for mobile/tablet

**Real-time Timer Synchronization:**
```typescript
// WebSocket timer sync with 1-second precision
class ExamTimer {
  private socket: Socket;
  private serverTimeOffset: number = 0;
  private localTimer: NodeJS.Timeout;
  
  syncWithServer() {
    // Sync every 30 seconds, fallback polling every 5 seconds
  }
  
  getAccurateTimeRemaining(): number {
    // Account for server time offset
  }
}
```

**Auto-grading Engine:**
- Immediate scoring for objective questions
- Manual grading queue for essays
- Partial credit calculation
- Score normalization and statistics

**Polling Fallback System:**
- Triggered on WebSocket disconnect or missed heartbeats
- 5-second intervals during active exam
- Automatic reconnection attempts
- State synchronization on reconnect

### Phase 4: Advanced Features & Deployment

**Performance Optimizations:**
- Redis caching for frequently accessed exams
- Database query optimization with indexes
- Image optimization and CDN setup
- Connection pooling for 1500 concurrent users

**Deployment Architecture:**
```
Internet → Nginx Load Balancer → Multiple Node.js Instances
                              ↓
                         Redis Cluster (Sessions + PubSub)
                              ↓
                         PostgreSQL Database
```

**AWS Setup Instructions:**
1. Launch EC2 t2.small instance with Ubuntu 22.04 LTS
2. Install Node.js 22.x LTS, PostgreSQL 17, Redis 7.2
3. Configure Nginx with WebSocket proxy support
4. Set up PM2 for process management
5. Configure SSL with Let's Encrypt

## Test-Driven Development Workflow

**Vitest Configuration:**
- Unit tests for business logic and utilities
- Integration tests for API endpoints with test database
- Component tests for React UI with Vietnamese text
- WebSocket connection and timer synchronization tests

**Playwright End-to-End Testing:**
- Complete exam workflow: login → create exam → take exam → view results
- Timer functionality and auto-submit scenarios
- Multi-user concurrent testing
- Cross-browser compatibility (Chrome, Firefox, Safari)

**Testing Priorities:**
- Authentication and authorization flows
- Exam timer accuracy and synchronization
- Question validation and grading logic
- WebSocket connection reliability
- Database transaction integrity

## Documentation Strategy

**Real-time Documentation Updates:**
- API documentation with request/response examples
- Database schema changes and migration guides
- WebSocket event specifications
- Component usage guidelines
- Deployment procedures and troubleshooting

**Documentation Files:**
- `docs/api.md`: REST API and WebSocket endpoints
- `docs/database.md`: Schema design and migration procedures
- `docs/frontend.md`: Component library and state management
- `docs/deployment.md`: AWS setup and scaling guides
- `docs/testing.md`: Test strategies and coverage reports

Each feature implementation includes corresponding documentation updates to maintain accuracy and completeness for future development sessions.