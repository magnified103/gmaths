# GMATHS Online Testing Platform - Cursor AI Implementation Plan

## Overview

This implementation plan is specifically designed for **Cursor AI IDE workflows** with an emphasis on:
- **Frontend-first development** with production-grade UI during development
- **Self-contained steps** that can be completed in single chat sessions
- **Full-stack features** developed together (frontend → backend → tests → commit)
- **Vietnamese UI** from day one for immediate visual feedback
- **Each phase concluding with a working AWS deployment**

## 🚨 Essential Cursor Rules Reminders

**ALWAYS refer to these guidelines during development:**

### From IMPORTANT.md:
- **Always use `pnpm` instead of `npm`** - never assume commands are equivalent
- **Never read/write `.env` files** - output changes in code blocks for manual updates
- **Never assume command output** - ask user to run commands if uncertain
- **Address ALL linter/compiler errors immediately** - no proceeding with unresolved errors
- **Never assume current working directory** - always run `pwd` first
- **Avoid "reward hacking"** - stop and explain issues instead of repeatedly trying fixes

### From style-guide.md:
- **Use 2 spaces for indentation** - never tabs
- **Vietnamese UI text** for all user-facing content
- **JSDoc comments** required for non-trivial functions
- **TypeScript strict mode** enabled
- **Single quotes** for strings, template literals for expressions
- **Trailing commas** in multiline structures

## Project Structure (Enforced from Day One)

```
gmaths-education-website/
├── backend/                    # Fastify server (Node.js/TypeScript)
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Data models and interfaces  
│   │   ├── utils/             # Utility functions
│   │   └── plugins/           # Fastify plugins
│   ├── prisma/                # Database schema and migrations
│   ├── tests/                 # Backend unit/integration tests
│   └── package.json
├── frontend/                   # Vite + React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components (Vietnamese UI)
│   │   ├── api/               # API client functions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Frontend utilities
│   │   └── types/             # TypeScript interfaces
│   ├── tests/                 # Frontend unit tests
│   └── package.json
├── e2e/                       # End-to-end tests (Playwright)
│   └── tests/
├── docs/                      # Documentation updates (each step)
└── package.json               # Root workspace config
```

## Phase 0: Bootstrap Foundation

### Step 0.1: Project Initialization and Setup
**Duration:** Single chat session  
**Outcome:** Working monorepo with basic CI/CD

**Tasks:**
1. **Frontend Setup:**
   - Initialize Vite + React + TypeScript frontend
   - Install TailwindCSS, TanStack Query, Headless UI
   - Create basic Vietnamese layout components (Header, Footer, Navigation)
   - Add MathLive and MathJax dependencies
   - Setup basic routing structure

2. **Backend Setup:**
   - Initialize Fastify + TypeScript backend
   - Setup Prisma with PostgreSQL
   - Install authentication, validation, and WebSocket dependencies
   - Create basic health check endpoint

3. **Infrastructure:**
   - Configure pnpm workspace
   - Setup ESLint, Prettier, TypeScript configs
   - Create basic GitHub Actions workflow
   - Initialize docs structure

**Documentation Update:** Create `docs/setup.md` with workspace configuration

### Step 0.2: AWS Deployment Pipeline
**Duration:** Single chat session  
**Outcome:** Deployed hello-world app on AWS

**Tasks:**
1. Create AWS deployment configuration
2. Setup Nginx configuration for static serving
3. Deploy basic "Hello GMATHS" page in Vietnamese
4. Verify SSL and domain configuration
5. Document deployment process

**Documentation Update:** Update `docs/deployment.md` with AWS setup instructions

**🎯 Phase 0 Milestone:** Working AWS domain serving Vietnamese "Hello GMATHS" page

---

## Phase 1: MVP - Secure Exam Delivery

### Step 1.1: Authentication UI Components (Frontend Focus)
**Duration:** Single chat session  
**Outcome:** Beautiful Vietnamese authentication interface

**Tasks:**
1. **Create Production-Grade Auth Components:**
   - `LoginForm.tsx` with Vietnamese labels and validation
   - `RegistrationForm.tsx` with email verification UI
   - `PasswordResetForm.tsx` with secure reset flow
   - `AuthLayout.tsx` with GMATHS branding
   - Form validation with Vietnamese error messages

2. **Styling and UX:**
   - Implement GMATHS color scheme and typography
   - Add loading states and animations
   - Responsive design for mobile/tablet
   - Accessibility features (WCAG compliance)

3. **State Management:**
   - Setup authentication state with TanStack Query
   - Create auth hooks for form handling
   - Mock API responses for development

**Documentation Update:** Add to `docs/auth.md` - frontend auth components

### Step 1.2: Authentication Backend Implementation
**Duration:** Single chat session  
**Outcome:** Secure JWT authentication system

**Tasks:**
1. **Database Schema:**
   - Design User model with Prisma
   - Add role-based permissions (student, admin)
   - Create migration files

2. **Authentication Service:**
   - JWT token generation and validation
   - Password hashing with bcrypt
   - Email verification system
   - Password reset functionality

3. **API Routes:**
   - `/auth/login`, `/auth/register`, `/auth/reset`
   - Request validation with Zod
   - Rate limiting and security headers

**Documentation Update:** Update `docs/auth.md` - API endpoints and database schema

### Step 1.3: Backend Testing and Frontend Integration
**Duration:** Single chat session  
**Outcome:** Fully functional authentication flow

**Tasks:**
1. **Backend Testing:**
   - Unit tests for auth services
   - Integration tests for auth routes
   - Test password hashing and JWT validation

2. **Frontend Integration:**
   - Connect forms to real API endpoints
   - Handle success/error states
   - Add redirect logic post-authentication

3. **Manual Testing Space:**
   - Test complete registration → email verification → login flow
   - Verify Vietnamese error messages display correctly
   - Test responsive design on different devices

**Documentation Update:** Update `docs/testing.md` - auth testing procedures

### Step 1.4: User Management UI (Admin Interface)
**Duration:** Single chat session  
**Outcome:** Admin dashboard for user management

**Tasks:**
1. **Admin Dashboard Components:**
   - `UserList.tsx` with search and filtering (Vietnamese)
   - `UserForm.tsx` for creating/editing users
   - `BulkUpload.tsx` for CSV import functionality
   - Navigation and layout for admin section

2. **CSV Upload Interface:**
   - Drag-drop file upload component
   - Preview and validation of CSV data
   - Progress indicators and error reporting
   - Download template functionality

**Documentation Update:** Update `docs/admin.md` - admin interface components

### Step 1.5: CSV User Import Backend
**Duration:** Single chat session  
**Outcome:** Bulk user import functionality

**Tasks:**
1. **CSV Processing Service:**
   - Parse CSV files with validation
   - Bulk user creation with error handling
   - Generate secure passwords and send emails

2. **API Implementation:**
   - `/admin/users/import` endpoint
   - File upload handling
   - Progress tracking and status updates

3. **Backend Testing:**
   - Unit tests for CSV processing
   - Integration tests for bulk import
   - Error handling test cases

**Documentation Update:** Update `docs/admin.md` - CSV import API and validation rules

### Step 1.6: User Management Integration and Testing
**Duration:** Single chat session  
**Outcome:** Complete user management system

**Tasks:**
1. **Frontend-Backend Integration:**
   - Connect CSV upload to backend
   - Real-time progress updates
   - Error handling and user feedback

2. **E2E Testing:**
   - Admin login → CSV upload → user creation flow
   - Verify Vietnamese UI throughout process
   - Test error scenarios

3. **Manual Testing Space:**
   - Test large CSV imports
   - Verify email notifications work
   - Check admin permissions and security

**Documentation Update:** Complete `docs/admin.md` with full user management workflow

### Step 1.7: Question Creation UI (Math Editor Focus)
**Duration:** Single chat session  
**Outcome:** Production-grade mathematical question editor

**Tasks:**
1. **Math Editor Components:**
   - `MathEditor.tsx` with MathLive integration
   - `QuestionForm.tsx` with Vietnamese labels
   - `AnswerOptions.tsx` for multiple choice
   - LaTeX preview with MathJax rendering

2. **Question Bank Interface:**
   - `QuestionList.tsx` with search and categories
   - `QuestionCard.tsx` for preview display
   - Drag-drop for question ordering
   - Import/export functionality UI

**Documentation Update:** Create `docs/questions.md` - question editor components

### Step 1.8: Question Storage Backend
**Duration:** Single chat session  
**Outcome:** Flexible JSON-based question system

**Tasks:**
1. **Database Design:**
   - Extensible Question model with JSON fields
   - Question types interfaces (TypeScript)
   - Category and tagging system

2. **Question Services:**
   - CRUD operations for questions
   - Validation for different question types
   - LaTeX processing and validation

3. **API Routes:**
   - RESTful question management endpoints
   - File upload for images/media
   - Bulk operations support

**Documentation Update:** Update `docs/questions.md` - API schema and question types

### Step 1.9: Question Management Integration and Testing
**Duration:** Single chat session  
**Outcome:** Complete question authoring system

**Tasks:**
1. **Frontend Integration:**
   - Connect math editor to backend
   - Real-time LaTeX preview
   - Auto-save functionality

2. **Testing:**
   - Unit tests for question validation
   - Integration tests for question CRUD
   - Frontend component testing

3. **Manual Testing Space:**
   - Create complex mathematical questions
   - Test LaTeX rendering performance
   - Verify Vietnamese interface consistency

**Documentation Update:** Complete `docs/questions.md` with full authoring workflow

### Step 1.10: Exam Creation UI
**Duration:** Single chat session  
**Outcome:** Comprehensive exam builder interface

**Tasks:**
1. **Exam Builder Components:**
   - `ExamForm.tsx` with settings configuration
   - `QuestionSelector.tsx` from question bank
   - `ExamPreview.tsx` with student view
   - Timer and scheduling configuration UI

2. **Advanced Features:**
   - Question randomization settings
   - Exam password configuration
   - Time limit and attempt settings
   - Publishing workflow UI

**Documentation Update:** Create `docs/exams.md` - exam creation interface

### Step 1.11: Exam Configuration Backend
**Duration:** Single chat session  
**Outcome:** Robust exam management system

**Tasks:**
1. **Database Schema:**
   - Exam model with JSON configuration
   - Exam-Question relationships
   - Scheduling and access control

2. **Exam Services:**
   - Exam creation and configuration
   - Question assignment and randomization
   - Scheduling validation

3. **API Implementation:**
   - Exam CRUD endpoints
   - Question selection and ordering
   - Publishing and access control

**Documentation Update:** Update `docs/exams.md` - API schema and configuration options

### Step 1.12: Exam Management Integration and Testing
**Duration:** Single chat session  
**Outcome:** Complete exam authoring system

**Tasks:**
1. **Frontend Integration:**
   - Connect exam builder to backend
   - Real-time preview updates
   - Validation and error handling

2. **Testing:**
   - Unit tests for exam configuration
   - Integration tests for exam creation flow
   - Edge case testing (scheduling conflicts, etc.)

3. **Manual Testing Space:**
   - Create complex exams with multiple question types
   - Test randomization and scheduling
   - Verify exam preview accuracy

**Documentation Update:** Complete `docs/exams.md` with full exam creation workflow

### Step 1.13: Exam Taking UI (WebSocket Timer)
**Duration:** Single chat session  
**Outcome:** Real-time exam interface with synchronized timer

**Tasks:**
1. **Exam Interface Components:**
   - `ExamInterface.tsx` with question navigation
   - `TimerDisplay.tsx` with WebSocket synchronization
   - `AnswerInput.tsx` for different question types
   - Progress tracking and auto-save UI

2. **WebSocket Client:**
   - Timer synchronization logic
   - Polling fallback implementation
   - Connection recovery handling
   - Auto-submit on timeout

**Documentation Update:** Create `docs/exam-taking.md` - student interface components

### Step 1.14: WebSocket Timer Backend
**Duration:** Single chat session  
**Outcome:** Real-time timer synchronization system

**Tasks:**
1. **WebSocket Server:**
   - Socket.io implementation with Redis
   - Timer synchronization logic
   - Session management and validation

2. **Timer Services:**
   - Server-authoritative time tracking
   - Auto-submit functionality
   - Connection state management

3. **Redis Integration:**
   - Session storage and pub/sub
   - Timer state persistence
   - Scaling preparation

**Documentation Update:** Update `docs/exam-taking.md` - WebSocket implementation and timer logic

### Step 1.15: Exam Taking Integration and Testing
**Duration:** Single chat session  
**Outcome:** Fully functional exam experience

**Tasks:**
1. **Frontend-Backend Integration:**
   - Connect WebSocket timer to UI
   - Implement auto-save and submit
   - Handle connection issues gracefully

2. **Testing:**
   - Unit tests for timer logic
   - Integration tests for WebSocket connection
   - Load testing for concurrent users

3. **Manual Testing Space:**
   - Take complete exam with timer
   - Test connection interruption recovery
   - Verify auto-submit functionality

**Documentation Update:** Complete `docs/exam-taking.md` with full exam experience

### Step 1.16: Grading and Results UI
**Duration:** Single chat session  
**Outcome:** Results display and leaderboard interface

**Tasks:**
1. **Results Components:**
   - `ExamResults.tsx` with score display
   - `Leaderboard.tsx` with ranking system
   - `PerformanceChart.tsx` with statistics
   - Results sharing and download UI

2. **Admin Grading Interface:**
   - `GradingQueue.tsx` for manual grading
   - `ScoreReview.tsx` for result verification
   - Bulk operations for grading

**Documentation Update:** Create `docs/grading.md` - results and grading interfaces

### Step 1.17: Auto-Grading Backend
**Duration:** Single chat session  
**Outcome:** Automatic scoring and results system

**Tasks:**
1. **Grading Engine:**
   - Auto-scoring for objective questions
   - Partial credit calculation
   - Score normalization and statistics

2. **Results Service:**
   - Result calculation and storage
   - Leaderboard generation
   - Performance analytics

3. **API Implementation:**
   - Results retrieval endpoints
   - Leaderboard APIs
   - Statistics and analytics

**Documentation Update:** Update `docs/grading.md` - grading algorithms and API

### Step 1.18: Results System Integration and Testing
**Duration:** Single chat session  
**Outcome:** Complete grading and results system

**Tasks:**
1. **Frontend Integration:**
   - Connect results display to backend
   - Real-time leaderboard updates
   - Results visualization

2. **Testing:**
   - Unit tests for grading algorithms
   - Integration tests for results flow
   - Performance testing for leaderboards

3. **Manual Testing Space:**
   - Complete exam → grading → results flow
   - Verify Vietnamese result displays
   - Test leaderboard accuracy

**Documentation Update:** Complete `docs/grading.md` with full results workflow

### Step 1.19: MVP Integration and Polish
**Duration:** Single chat session  
**Outcome:** Polished MVP ready for deployment

**Tasks:**
1. **UI Polish:**
   - Consistent Vietnamese translations
   - Loading states and animations
   - Error handling and user feedback
   - Mobile responsiveness verification

2. **Security Audit:**
   - Authentication and authorization review
   - Input validation verification
   - SQL injection and XSS prevention

3. **Performance Optimization:**
   - Database query optimization
   - Frontend bundle optimization
   - WebSocket connection optimization

**Documentation Update:** Create `docs/mvp-features.md` - complete feature overview

### Step 1.20: MVP Deployment and Documentation
**Duration:** Single chat session  
**Outcome:** Live MVP on AWS domain

**Tasks:**
1. **Deployment Pipeline:**
   - Build and deployment automation
   - Environment configuration
   - Database migration execution

2. **Documentation Completion:**
   - User guides in Vietnamese
   - Admin documentation
   - API documentation
   - Troubleshooting guides

3. **Manual Testing Space:**
   - End-to-end testing on live environment
   - Performance testing under load
   - User acceptance testing

**Documentation Update:** Complete all documentation with deployment guides

**🎯 Phase 1 Milestone:** Live MVP with secure exam delivery, authentication, question authoring, exam taking with real-time timer, and auto-grading

---

## Phase 2: Content & Communications

### Step 2.1: Advanced Question Types UI
**Duration:** Single chat session  
**Outcome:** Support for all question types with Vietnamese interface

**Tasks:**
1. **Question Type Components:**
   - `MultiSelectQuestion.tsx` for multiple correct answers
   - `TrueFalseQuestion.tsx` with randomization
   - `FillBlankQuestion.tsx` with multiple acceptable answers
   - `EssayQuestion.tsx` for long-form responses

2. **Enhanced Editor Features:**
   - Question type selector with previews
   - Advanced validation rules
   - Bulk question operations
   - Template system for common patterns

**Documentation Update:** Update `docs/questions.md` - advanced question types

### Step 2.2: Advanced Question Types Backend
**Duration:** Single chat session  
**Outcome:** Complete question type system

**Tasks:**
1. **Extended Schema:**
   - Support for all question types in JSON
   - Validation rules for each type
   - Scoring algorithms for partial credit

2. **Question Processing:**
   - Type-specific validation
   - Answer processing and normalization
   - Randomization services

**Documentation Update:** Update `docs/questions.md` - backend implementation

### Step 2.3: Question Import/Export System
**Duration:** Single chat session  
**Outcome:** Bulk question management

**Tasks:**
1. **CSV Processing UI:**
   - Multi-type question import interface
   - Export with filtering and formatting
   - Validation preview and error reporting

2. **Backend Processing:**
   - CSV parsing for all question types
   - Bulk operations with transaction safety
   - Export formatting and optimization

3. **Testing and Integration:**
   - Test all question type imports
   - Verify export accuracy
   - Performance testing for large sets

**Documentation Update:** Create `docs/question-import.md` - CSV schemas and processes

### Step 2.4: Student Communication System UI
**Duration:** Single chat session  
**Outcome:** Student mailing and announcement interface

**Tasks:**
1. **Communication Components:**
   - `StudentSelector.tsx` for choosing recipients
   - `MessageComposer.tsx` with rich text editor
   - `AnnouncementBoard.tsx` for displaying messages
   - Email template and preview system

**Documentation Update:** Create `docs/communications.md` - student communication features

### Step 2.5: Mailing System Backend
**Duration:** Single chat session  
**Outcome:** Email and announcement system

**Tasks:**
1. **Messaging Service:**
   - Email composition and sending (AWS SES)
   - Student selection and filtering
   - Message templates and personalization

2. **Announcement System:**
   - Message storage and retrieval
   - Delivery tracking and status
   - Bulk operations and scheduling

**Documentation Update:** Update `docs/communications.md` - backend implementation

### Step 2.6: Posts and News System
**Duration:** Single chat session  
**Outcome:** Content management for public and private posts

**Tasks:**
1. **Content Management UI:**
   - `PostEditor.tsx` with rich text and media
   - `CategoryManager.tsx` for organizing posts
   - `PostList.tsx` with filtering and search
   - Public landing page integration

2. **Backend Implementation:**
   - Post CRUD with categories
   - Public/private visibility controls
   - Media upload and management
   - SEO optimization for public posts

3. **Integration and Testing:**
   - Test post creation and publication
   - Verify public/private access controls
   - Test media upload and display

**Documentation Update:** Create `docs/content-management.md` - posts and news system

### Step 2.7: Personal History and Analytics UI
**Duration:** Single chat session  
**Outcome:** Student progress tracking interface

**Tasks:**
1. **Student Dashboard Components:**
   - `ProgressChart.tsx` with performance trends
   - `ExamHistory.tsx` with detailed results
   - `Achievement.tsx` for milestones and badges
   - Progress comparison and goal setting

**Documentation Update:** Create `docs/student-analytics.md` - progress tracking features

### Step 2.8: Analytics Backend and Data Processing
**Duration:** Single chat session  
**Outcome:** Comprehensive student analytics system

**Tasks:**
1. **Analytics Engine:**
   - Progress calculation and trending
   - Performance metrics and statistics
   - Achievement tracking and badges
   - Comparative analytics

2. **Data Storage and Optimization:**
   - Efficient query design for analytics
   - Caching strategies for performance
   - Data aggregation and preprocessing

**Documentation Update:** Update `docs/student-analytics.md` - analytics implementation

### Step 2.9: Phase 2 Integration and Deployment
**Duration:** Single chat session  
**Outcome:** Complete Phase 2 deployment

**Tasks:**
1. **Feature Integration:**
   - Test all new question types in exams
   - Verify communication systems work
   - Test analytics and progress tracking

2. **Performance Optimization:**
   - Database indexing for new features
   - Frontend optimization for new components
   - Cache optimization for analytics

3. **Deployment and Documentation:**
   - Deploy Phase 2 features to AWS
   - Update user documentation
   - Create training materials

**Documentation Update:** Complete Phase 2 documentation and user guides

**🎯 Phase 2 Milestone:** Enhanced platform with all question types, communication systems, content management, and student analytics

---

## Phase 3: Insights & Teacher Analytics

### Step 3.1: Teacher Dashboard UI
**Duration:** Single chat session  
**Outcome:** Comprehensive teacher analytics interface

**Tasks:**
1. **Dashboard Components:**
   - `TeacherOverview.tsx` with key metrics
   - `ClassPerformance.tsx` with detailed analytics
   - `QuestionAnalysis.tsx` for difficulty insights
   - `StudentProgress.tsx` for individual tracking

**Documentation Update:** Create `docs/teacher-dashboard.md` - analytics interface

### Step 3.2: Advanced Analytics Backend
**Duration:** Single chat session  
**Outcome:** Powerful analytics and reporting system

**Tasks:**
1. **Analytics Engine:**
   - Advanced statistical calculations
   - Trend analysis and predictions
   - Comparative performance metrics
   - Custom ranking criteria

2. **Report Generation:**
   - PDF and CSV export functionality
   - Customizable report templates
   - Scheduled report delivery
   - Data visualization services

**Documentation Update:** Update `docs/teacher-dashboard.md` - backend analytics

### Step 3.3: Bulk Export and Reporting
**Duration:** Single chat session  
**Outcome:** Comprehensive data export system

**Tasks:**
1. **Export UI:**
   - Flexible filtering and selection
   - Multiple format support
   - Progress tracking for large exports
   - Custom report templates

2. **Export Processing:**
   - Background job processing
   - Large dataset optimization
   - Format conversion services
   - Delivery and notification system

**Documentation Update:** Create `docs/data-export.md` - export and reporting features

### Step 3.4: Audit Logging System
**Duration:** Single chat session  
**Outcome:** Comprehensive audit trail

**Tasks:**
1. **Audit UI:**
   - `AuditLog.tsx` for viewing system events
   - Filtering and search capabilities
   - Event details and timelines
   - Security incident tracking

2. **Logging Backend:**
   - Comprehensive event logging
   - Security event detection
   - Log rotation and archival
   - Performance impact optimization

**Documentation Update:** Create `docs/audit-logging.md` - audit and security features

### Step 3.5: Phase 3 Integration and Deployment
**Duration:** Single chat session  
**Outcome:** Complete Phase 3 deployment

**Tasks:**
1. **Feature Testing:**
   - Test all analytics features
   - Verify export functionality
   - Test audit logging accuracy

2. **Performance Optimization:**
   - Optimize for t3.small instance requirements
   - Cache optimization for analytics
   - Database performance tuning

3. **Deployment:**
   - Deploy Phase 3 to AWS
   - Monitor system performance
   - Update documentation

**Documentation Update:** Complete Phase 3 documentation

**🎯 Phase 3 Milestone:** Advanced analytics platform with teacher insights, bulk export, and comprehensive audit logging

---

## Phase 4: Proctoring & Anti-Cheat

### Step 4.1: Basic Proctoring UI
**Duration:** Single chat session  
**Outcome:** Tab-switch and fullscreen monitoring interface

**Tasks:**
1. **Proctoring Components:**
   - `ProctoringMonitor.tsx` for activity tracking
   - `SecurityWarnings.tsx` for violation alerts
   - `ActivityLog.tsx` for proctoring review
   - Fullscreen enforcement UI

**Documentation Update:** Create `docs/proctoring.md` - anti-cheat features

### Step 4.2: Basic Proctoring Backend
**Duration:** Single chat session  
**Outcome:** Activity monitoring and logging system

**Tasks:**
1. **Monitoring Services:**
   - Tab-switch detection and logging
   - Fullscreen enforcement
   - Activity timeline tracking
   - Violation threshold management

**Documentation Update:** Update `docs/proctoring.md` - monitoring implementation

### Step 4.3: AI Webcam Proctoring (Optional)
**Duration:** Single chat session  
**Outcome:** Basic AI-powered webcam monitoring

**Tasks:**
1. **AI Proctoring UI:**
   - Webcam access and display
   - Face detection indicators
   - Multiple person alerts
   - Graceful degradation handling

2. **AI Services:**
   - Face detection using TensorFlow.js
   - Multiple person detection
   - Head movement tracking
   - Fallback when AI fails

**Documentation Update:** Update `docs/proctoring.md` - AI webcam features

### Step 4.4: Phase 4 Integration and Deployment
**Duration:** Single chat session  
**Outcome:** Complete proctoring system

**Tasks:**
1. **System Integration:**
   - Test proctoring with exam flow
   - Verify graceful degradation
   - Test activity logging accuracy

2. **Deployment:**
   - Deploy proctoring features
   - Monitor GPU usage (if applicable)
   - Update security documentation

**Documentation Update:** Complete proctoring documentation

**🎯 Phase 4 Milestone:** Comprehensive anti-cheat system with AI-powered proctoring options

---

## Phase 5: Scale-Out Architecture

### Step 5.1: Microservices Architecture Planning
**Duration:** Single chat session  
**Outcome:** Architecture design for scale-out

**Tasks:**
1. **Service Decomposition:**
   - Design auth service boundaries
   - Plan exam service separation
   - Design content service architecture
   - Plan messaging service structure

**Documentation Update:** Create `docs/microservices.md` - scale-out architecture

### Step 5.2: Load Balancing and CDN Setup
**Duration:** Single chat session  
**Outcome:** High-availability infrastructure

**Tasks:**
1. **Infrastructure Setup:**
   - Application Load Balancer configuration
   - CloudFront CDN setup
   - Auto-scaling group configuration
   - Database read replicas

**Documentation Update:** Update `docs/deployment.md` - scaled infrastructure

### Step 5.3: Gradual Service Extraction
**Duration:** Multiple chat sessions (as needed)
**Outcome:** Microservices deployment with blue/green

**Tasks:**
1. **Service Extraction:**
   - Extract authentication service
   - Extract exam service
   - Extract content service
   - Implement service communication

**Documentation Update:** Update `docs/microservices.md` - service extraction process

**🎯 Phase 5 Milestone:** Horizontally scalable microservices architecture

---

## Documentation Strategy

Each step includes **immediate documentation updates** to maintain context for future chat sessions:

### Essential Documentation Files:
- `docs/setup.md` - Project setup and workspace configuration
- `docs/auth.md` - Authentication system documentation
- `docs/questions.md` - Question management system
- `docs/exams.md` - Exam creation and management
- `docs/exam-taking.md` - Student exam experience
- `docs/grading.md` - Grading and results system
- `docs/communications.md` - Student communication features
- `docs/student-analytics.md` - Progress tracking and analytics
- `docs/teacher-dashboard.md` - Teacher insights and analytics
- `docs/data-export.md` - Export and reporting system
- `docs/audit-logging.md` - Security and audit features
- `docs/proctoring.md` - Anti-cheat and proctoring
- `docs/deployment.md` - AWS deployment guides
- `docs/microservices.md` - Scale-out architecture

### Documentation Requirements:
- **API endpoints** with request/response examples
- **Component interfaces** with props and usage
- **Database schemas** with relationship diagrams
- **Configuration examples** for different environments
- **Troubleshooting guides** for common issues

## Testing Strategy

### Unit Tests (Immediate after each feature):
- Business logic validation
- API endpoint testing
- Component behavior testing
- Database operation testing

### Integration Tests (After each major feature):
- Frontend-backend integration
- Database transaction testing
- Authentication flow testing
- WebSocket connection testing

### E2E Tests (After each phase):
- Complete user workflows
- Cross-browser compatibility
- Performance under load
- Security vulnerability testing

## Success Criteria

Each phase must meet these criteria before proceeding:

1. **Functionality:** All features work as specified in PRD
2. **Vietnamese UI:** All user-facing text properly localized
3. **Performance:** Meets concurrent user requirements
4. **Security:** Passes security audit checklist
5. **Documentation:** Complete and up-to-date documentation
6. **Deployment:** Successfully deployed to AWS
7. **Testing:** All tests passing with adequate coverage

## Cross-Check with Product Requirements

This implementation plan addresses all requirements from the PRD:

### ✅ Phase 1 (MVP):
- User registration and management ✓
- Exam creation and configuration ✓
- Exam delivery with WebSocket timer ✓
- Scoring and grading ✓
- Vietnamese UI ✓
- CSV user import ✓
- Password reset ✓
- Question bank (MCQ-single) ✓
- Math editor ✓
- Exam scheduling with optional password ✓
- Auto-grade ✓
- Post-exam leaderboard ✓

### ✅ Phase 2 (Content & Comms):
- All question types (MCQ-multi, T/F, fill-in-blank, short-answer) ✓
- Randomization of questions and answers ✓
- Mailing list to chosen students ✓
- Posts/news with admin-defined categories ✓
- Public landing page ✓
- Personal history log ✓

### ✅ Phase 3 (Insights):
- Teacher dashboards ✓
- Bulk CSV score export ✓
- Custom ranking criteria ✓
- Downloadable transcripts (CSV/PDF) ✓
- Audit logs ✓

### ✅ Phase 4 (Proctoring):
- Tab-switch and fullscreen warnings ✓
- AI webcam checks (face-count/head-movement) ✓
- Activity log ✓

### ✅ Phase 5 (Scale-out):
- Microservices architecture ✓
- Load balancing and CDN ✓
- Blue/green deployments ✓

All technical requirements, performance targets, security measures, and accessibility features are incorporated throughout the phased approach.