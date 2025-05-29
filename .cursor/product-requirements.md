# GMATHS Online Testing Platform Project Requirements

## Introduction
GMATHS Education is developing a comprehensive online testing platform for mathematics and related subjects (STEAM). This Project Requirements Document (PRD) outlines the features and specifications for a phased implementation, starting with a Minimum Viable Product (MVP) focused on secure exam delivery. The platform will allow students to take practice tests and formal exams entirely online, providing an interactive and secure environment. The system is designed to support high concurrency (up to 1,500 simultaneous users on a t2.small AWS instance initially), using modern, optimized, and secure technologies. All user-facing interfaces are in Vietnamese, while development and code documentation are in English. Subsequent phases will introduce richer content, advanced analytics, optional AI proctoring, and scale-out architecture.

## Objectives and Goals
- **Interactive Math Testing:** Provide students with an intuitive online platform to practice and take exams in mathematics and integrated STEAM subjects with LaTeX support.
- **Robust Exam Management:** Enable administrators to easily create, schedule, and manage tests using JSON-based question storage for flexibility.
- **Real-time Features:** Implement WebSocket-based timer synchronization with polling fallback for reliable exam experiences.
- **High Performance:** Support 1,500 concurrent users efficiently using Redis caching and optimized database design.
- **Brand Alignment:** Deliver a user interface consistent with GMATHS Education's branding with content in Vietnamese.
- **Accessibility and Inclusivity:** Design the platform to be accessible with basic WCAG guidelines and secure data handling.

## Phased Roadmap

| Phase | Goal | Core Features | Target Instance | Blocking Dependencies |
|-------|------|---------------|-----------------|-----------------------|
| **0. Bootstrap** | Working skeleton | Repo, CI/CD, IaC for `t2.small`, Postgres, basic monolith | `t2.small` | — |
| **1. MVP** | Secure exam delivery | Auth & roles, CSV user import, password reset, question bank (MCQ-single), Math editor, exam scheduling with optional **exam password**, countdown timer, auto-grade, post-exam leaderboard, Vietnamese UI | `t2.small` | Phase 0 |
| **2. Content & Comms** | Richer learning tools | CSV import/export for **all** question types (MCQ-multi, T/F, fill-in-blank, short-answer), randomise Q&A, mailing-list to chosen students, posts/news with admin-defined categories, public landing page, personal history log | `t2.small` (monitor) | Phase 1 |
| **3. Insights** | Data-driven teaching | Teacher dashboards, bulk CSV score export, custom ranking criteria, downloadable transcripts (CSV/PDF), audit logs | maybe `t3.small` | Phase 2 |
| **4. Proctoring+** | Anti-cheat | Tab-switch & fullscreen warnings, AI webcam checks (face-count/head-movement), activity log | `t3.small` + GPU optional | Phase 3 |
| **5. Scale-out** | High traffic | Gradual extract to micro-services (auth, exam, content, messaging) using blue/green & canary deploys; ALB + RDS read-replicas; CDN for static media | cluster | Phases 1-4 complete |

## User Roles and Personas
- **Student (Primary User):** Takes practice tests and scheduled exams with real-time timer synchronization and immediate feedback.
- **Administrator (Educator/Content Creator):** GMATHS Education staff who manage the platform, create exam content with LaTeX support, schedule exams, and review results through Vietnamese admin interfaces.

## Functional Requirements

### 1. User Registration and Management
- **Roles:** Admin (Teacher), Student.
- **Student Registration:** Self-registration (Students only) with email verification using secure password hashing (bcrypt).
- **Admin CSV User Import:** Administrators can perform bulk user import via CSV (`username,email,password`), with an option to create new users or overwrite existing ones.
- **Authentication:** JWT-based authentication with Redis session management for performance optimization.
- **Password Recovery:** Secure password reset flow with time-limited tokens (secure link based).
- **Profile Management:** Students can update basic profile information with admin oversight for critical changes.
- **Admin User Management:** Administrators can create, edit, or deactivate student accounts with role-based access control.
- **Security:** Login attempt limits, secure session handling, and protection against brute force attacks.
- **Concurrency Support:** Hybrid JWT + Redis session management to efficiently handle 1,500 concurrent users.
- **Localization:** All visible UI strings in Vietnamese.

### 2. Exam Creation and Configuration (Administrator)
- **JSON-Based Question Storage:** Flexible question storage using JSON fields in the database with extensible TypeScript interfaces for different question types.
- **Question Types:** Support for multiple question formats with sub-interfaces for extensibility:
  - Phase 1: Multiple Choice (single answer) with randomizable option order.
  - Phase 2 onwards: Multiple Select (multiple correct answers) with partial scoring options, True/False questions, Fill-in-the-Blank with multiple acceptable answers and case sensitivity options, Short Answer/Essay questions requiring manual grading.
  - LaTeX-enabled mathematical expressions rendered client-side with MathJax (consider **MathLive** `<math-field>` component for input).
- **CSV Import/Export:** Support for bulk import/export of questions via CSV (schema to be defined in developer documentation). Example schema for MCQ-single provided below.
- **Exam Assembly:** Administrators create exams by combining questions with:
  - Title, description, and Vietnamese instructions
  - Configurable point values per question
  - Question randomization options (randomize questions **and** answer order per student)
  - Section organization capabilities
- **Exam Settings:** Configure exam parameters including:
  - Time limits with WebSocket-synchronized countdown timers
  - Availability windows (start/end dates)
  - Attempt limits per student
  - Navigation control (linear vs. free navigation)
  - Randomization settings for questions and options
  - Immediate vs. delayed feedback policies
  - Passing criteria configuration
  - Exam password toggle
- **Draft and Publish System:** Save exams as drafts and publish when ready, with version control for changes.

### 3. Exam Delivery and Student Experience
- **Student Dashboard:** Vietnamese interface showing upcoming exams, available practice tests, recent results, and post-exam leaderboards (ranked by score then completion-time, auto-published when exam window closes).
- **Exam Interface:** 
  - Vietnamese instructions with LaTeX-rendered mathematical content
  - WebSocket-synchronized timer with 1-second precision and polling fallback, with auto-submit on timeout.
  - Optional early-submit button.
  - Auto-save functionality every 10 seconds.
  - Client-side storage guard: auto-resume if browser refreshes (Phase 2).
  - Responsive design supporting desktop, tablet, and mobile devices
  - Real-time answer preservation with connection recovery
- **Timer Synchronization:** Server-synchronized countdown with:
  - WebSocket primary connection for real-time updates
  - Polling fallback every 5 seconds on connection loss
  - Automatic reconnection with state restoration
  - Time drift compensation using server time offset
- **Navigation:** Configurable navigation patterns based on exam settings with progress indicators.
- **Accessibility:** Basic WCAG compliance with keyboard navigation and screen reader support.

### 4. Scoring, Grading, and Feedback
- **Automatic Grading:** Immediate scoring for objective question types (MCQ-single in Phase 1) with configurable partial credit.
- **Manual Grading (Phase 2):** Queue system for essay/short-answer questions with admin grading interface and manual rubric application.
- **Result Calculation:** Accurate score calculation with percentage and pass/fail determination.
- **Student Results:** 
  - Immediate feedback for practice tests with detailed explanations (where allowed by exam settings)
  - Delayed feedback for formal exams as configured by administrators
  - Vietnamese result displays with clear score presentation
- **Immutable Student History (Phase 2):** The system stores an immutable history of exam attempts and results per student.
- **Admin Analytics:** Comprehensive result analysis with:
  - Per-exam statistics (average score, completion rates)
  - Per-question analysis highlighting difficult questions
  - Exportable result data for offline analysis (CSV export Phase 3)
  - Leaderboard views (ranked by score then completion-time).

### 5. Anti-Cheating and Exam Integrity Measures
- **Event Logging Infrastructure:** Extensible system for tracking suspicious activities without affecting core MVP functionality.
- **Browser-based Deterrents:** 
  - Full-screen mode encouragement with focus tracking.
  - Copy-paste restrictions on exam content.
  - Right-click context menu disabling.
- **Tab-switch & Fullscreen Warnings (Phase 4):** Monitor and log tab-switching or exiting fullscreen mode during exams.
- **AI Webcam Checks (Optional - Phase 4):** Implement basic AI-driven webcam checks for face count and significant head movement, if opted for. This feature should allow graceful degradation if AI components fail.
- **Randomization:** Question and option order randomization per student session.
- **Secure Answer Handling:** Correct answers never sent to client-side until after exam completion.
- **Session Management:** Single device enforcement with automatic logout on duplicate sessions.
- **Time Analytics:** Unusual completion time flagging for admin review.
- **Activity Log (Phase 4):** Comprehensive logging of student activity during exams for proctoring review.

### 6. Scheduling and Notifications
- **Exam Scheduling:** Server-enforced availability windows with timezone handling.
- **Email Notifications:** Automated reminders using AWS SES for upcoming exams and result availability.
- **Mailing List Feature (Phase 2):** Teachers can select a subset of students and push email/announcements (inspired by Canvas & Sensei).
- **In-App Notifications:** Dashboard notifications for new exams, upcoming deadlines, and available results.
- **Time Zone Management:** Consistent time display using server timezone (UTC+7) with clear timezone indicators.

### 7. User Interface & Branding Requirements
- **Vietnamese Localization:** All user interface elements in Vietnamese with proper diacritics support.
- **GMATHS Branding:** Official logo placement and brand color scheme implementation throughout the platform.
- **Responsive Design:** Cross-browser compatibility (Chrome, Firefox, Safari, Edge) with mobile-first approach.
- **Mathematical Content:** Client-side LaTeX rendering using MathJax for questions and answers.
- **User Experience:** Clear navigation, intuitive form design, and consistent interaction patterns.

### 8. Content & Posts (Phase 2)
- **Post Management (Admin):** Administrators can CRUD posts using a rich-text editor supporting images and video.
- **Categories:** Admin-definable categories for organizing posts.
- **Visibility Control:** Posts can be flagged as "Public" (visible on a root landing page) or private (visible only to logged-in students).

## Non-Functional Requirements

### Performance and Scalability
- **Concurrent Users (Baseline):** Support ≤1,500 simultaneous users on AWS t2.small instance (2 vCPU, 2 GiB) through optimized architecture.
- **Burst Capacity:** Monitor CPU credit balance; enable T2 Unlimited or plan migration to `t3.small` if CPU credits consistently <30%.
- **Response Times:** Sub-2-second response times for most user actions under full load.
- **WebSocket Scaling:** Redis pub/sub for WebSocket scaling with efficient memory usage.
- **Database Optimization:** Proper indexing and query optimization using Prisma ORM.
- **Caching Strategy:** Redis caching for frequently accessed exam data and session management.
- **Phase 5 Scalability:** Introduces Application Load Balancer (ALB) and additional application replicas, potentially using micro-service deployment strategies for high traffic scenarios.

### Security and Data Protection
- **Data Transmission:** HTTPS encryption (TLS 1.3 preferred) for all client-server communication.
- **Password Security:** bcrypt hashing (salted) with appropriate salt rounds for password storage.
- **Per-Exam Passwords:** Exam-specific passwords should be stored hashed if implemented.
- **Session Security:** Secure JWT implementation with Redis-backed refresh tokens.
- **Input Validation:** Comprehensive validation on both frontend (user experience) and backend (security).
- **Access Control:** Role-based authorization with proper route protection (checks on every API route).
- **Audit Logging:** Security event logging for monitoring and incident response.
- **Data Privacy:** Support for GDPR-style data delete/export on user request.

### Accessibility and Inclusivity
- **Basic WCAG Compliance:** Essential accessibility features implemented where convenient during development.
- **Keyboard Navigation:** Full keyboard accessibility for exam interface and navigation.
- **Screen Reader Support:** Semantic HTML structure with appropriate ARIA labels.
- **Visual Design:** Sufficient color contrast and resizable text support.
- **Responsive Layout:** Accessible design across different screen sizes and devices.

### Reliability
- **Database Backups:** Automated daily backups of the PostgreSQL database with point-in-time recovery capabilities.
- **System Monitoring:** Implement health probes and automated restart policies within the container orchestration environment (e.g., PM2, Docker Swarm, Kubernetes).
- **Graceful Degradation:** Design features, especially optional ones like AI proctoring, to degrade gracefully. For example, if webcam AI fails, the exam should continue without proctoring, and the event should be logged.

### Development and Project Constraints
- **Technology Stack:** Modern web technologies optimized for performance and maintainability.
- **Code Quality:** TypeScript throughout with strict typing and comprehensive error handling.
- **Documentation:** Real-time documentation updates with each feature implementation.
- **Testing Strategy:** Unit, integration, and end-to-end testing covering critical user flows.
- **Deployment:** AWS EC2 deployment with Nginx reverse proxy and PM2 process management.

## Technical Implementation Notes

### Database Design
- **Extensible Schema:** JSON-based question storage allowing future question type additions without schema migrations.
- **Performance Optimization:** Proper indexing for high-concurrency scenarios with efficient query patterns.
- **Data Integrity:** Foreign key constraints and transaction management for consistent data state.

### Real-time Architecture
- **WebSocket Implementation:** Socket.io with Redis adapter for horizontal scaling capability.
- **Fallback Mechanisms:** Polling fallback ensures reliability during connection issues.
- **State Synchronization:** Server-authoritative timer state with client-side prediction for smooth UX.

### Security Architecture
- **Layered Security:** Multiple security layers from input validation to session management.
- **Principle of Least Privilege:** Role-based access with minimal necessary permissions.
- **Audit Trail:** Comprehensive logging for security monitoring and compliance.

### CSV Schemas (Excerpt for Phase 1 & 2)

#### User Import (Admin)
| Column | Required | Example |
|--------|----------|---------|
| `username` | ✓ | nguyen.minh |
| `email` | ✓ | minh@example.edu |
| `password` | ✓ | Abcd@1234 |

*Admins can use this to create new users or optionally overwrite existing users based on `username` or `email` as a key.* 

#### Question Import (MCQ-single - Phase 1)
| Column | Required | Description |
|--------|----------|-------------|
| `question_id` | ✓ | Unique slug for the question |
| `question_text` | ✓ | Supports inline LaTeX (rendered via MathJax/MathLive) |
| `choice_a` | ✓ | Answer option A |
| `choice_b` | ✓ | Answer option B |
| `choice_c` | ✓ | Answer option C |
| `choice_d` | ✓ | Answer option D |
| `correct_choice` | ✓ | Letter of the correct choice (e.g., `B`) |
| `points` |   | Default = 1 if omitted |

*(Full multi-type CSV schema for Phase 2+ question types like MCQ-multi, T/F, Fill-in-blank, Short-answer will be documented in the developer guide.)*

## Future Considerations

- **Edge Caching:** Implement edge caching of static assets via a CDN (e.g., AWS CloudFront) when concurrent user traffic consistently exceeds a threshold (e.g., >3,000 CCU) to improve load times and reduce origin server load.
- **Asynchronous Task Queue:** Introduce an asynchronous task queue (e.g., RabbitMQ, Redis Streams, AWS SQS) for handling heavy background tasks such as large CSV parsing, report generation, or video transcoding if multimedia content expands.
- **Single Sign-On (SSO):** For larger institutional clients (e.g., school districts), consider implementing SAML-based SSO integration with common identity providers like Google Workspace or Microsoft Azure AD (Potential for Phase 3+).
- **Mobile-First Progressive Web App (PWA):** If user analytics and surveys indicate a significant portion of students (e.g., ≥40%) are accessing the platform via mobile phones for taking exams, prioritize development of a mobile-first PWA for an optimized mobile experience.
- **Advanced AI Proctoring Features (Post-Phase 4):** Explore more advanced AI proctoring capabilities beyond basic webcam checks, such as gaze tracking, secondary device detection, or audio analysis, based on evolving academic integrity requirements and technological feasibility.
- **Gamification Elements:** Introduce gamification elements like badges, points for consistent practice, or timed challenges to increase student engagement.
- **Learning Analytics Expansion:** Further expand teacher dashboards with more in-depth learning analytics, such as identifying common misconceptions by topic or tracking student progress over time against learning objectives.

## Glossary

| Term | VN Translation | Note |
|------|----------------|------|
| Exam Password | *Mật khẩu kỳ thi* | Optional per exam, set by Admin. |
| Leaderboard | *Bảng xếp hạng* | Published after exam window closes; ranks by score then completion time. |
| Mailing List | *Danh sách gửi thư* | Feature for Teachers to send announcements to selected students (Phase 2). |
| Math Editor | *Trình nhập công thức* | Component for inputting mathematical formulas (e.g., MathLive). |
| MCQ-single | Multiple Choice, Single Answer | Question type. |
| CSV Import/Export | Comma Separated Values | Method for bulk data handling. |

## Conclusion
This PRD provides a comprehensive blueprint for the GMATHS Education Online Testing Platform with clear technical constraints and implementation guidance. The focus on performance optimization for high concurrency, Vietnamese user interface, and extensible architecture ensures the platform meets both immediate needs and future growth requirements. The hybrid approach of essential features with extensible design allows for rapid MVP delivery while maintaining long-term scalability.