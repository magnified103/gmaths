# GMATHS Online Testing Platform Project Requirements

## Introduction
GMATHS Education is developing a comprehensive online testing platform for mathematics and related subjects (STEAM). The platform will allow students to take practice tests and formal exams entirely online, providing an interactive and secure environment. This Project Requirements Document (PRD) outlines the features and specifications of the platform for implementation. The system supports high concurrency (up to 1,500 simultaneous users) on a t2.small AWS instance, using modern, optimized, and secure technologies. All user-facing interfaces are in Vietnamese, while development and code documentation are in English.

## Objectives and Goals
- **Interactive Math Testing:** Provide students with an intuitive online platform to practice and take exams in mathematics and integrated STEAM subjects with LaTeX support.
- **Robust Exam Management:** Enable administrators to easily create, schedule, and manage tests using JSON-based question storage for flexibility.
- **Real-time Features:** Implement WebSocket-based timer synchronization with polling fallback for reliable exam experiences.
- **High Performance:** Support 1,500 concurrent users efficiently using Redis caching and optimized database design.
- **Brand Alignment:** Deliver a user interface consistent with GMATHS Education's branding with content in Vietnamese.
- **Accessibility and Inclusivity:** Design the platform to be accessible with basic WCAG guidelines and secure data handling.

## User Roles and Personas
- **Student (Primary User):** Takes practice tests and scheduled exams with real-time timer synchronization and immediate feedback.
- **Administrator (Educator/Content Creator):** GMATHS Education staff who manage the platform, create exam content with LaTeX support, schedule exams, and review results through Vietnamese admin interfaces.

## Functional Requirements

### 1. User Registration and Management
- **Student Registration:** Registration with email verification using secure password hashing (bcrypt).
- **Authentication:** JWT-based authentication with Redis session management for performance optimization.
- **Password Recovery:** Secure password reset flow with time-limited tokens.
- **Profile Management:** Students can update basic profile information with admin oversight for critical changes.
- **Admin User Management:** Administrators can create, edit, or deactivate student accounts with role-based access control.
- **Security:** Login attempt limits, secure session handling, and protection against brute force attacks.
- **Concurrency Support:** Hybrid JWT + Redis session management to efficiently handle 1,500 concurrent users.

### 2. Exam Creation and Configuration (Administrator)
- **JSON-Based Question Storage:** Flexible question storage using JSON fields in the database with extensible TypeScript interfaces for different question types.
- **Question Types:** Support for multiple question formats with sub-interfaces for extensibility:
  - Multiple Choice (single answer) with randomizable option order
  - Multiple Select (multiple correct answers) with partial scoring options
  - True/False questions
  - Fill-in-the-Blank with multiple acceptable answers and case sensitivity options
  - Short Answer/Essay questions requiring manual grading
  - LaTeX-enabled mathematical expressions rendered client-side with MathJax
- **Exam Assembly:** Administrators create exams by combining questions with:
  - Title, description, and Vietnamese instructions
  - Configurable point values per question
  - Question randomization options
  - Section organization capabilities
- **Exam Settings:** Configure exam parameters including:
  - Time limits with WebSocket-synchronized countdown timers
  - Availability windows (start/end dates)
  - Attempt limits per student
  - Navigation control (linear vs. free navigation)
  - Randomization settings for questions and options
  - Immediate vs. delayed feedback policies
  - Passing criteria configuration
- **Draft and Publish System:** Save exams as drafts and publish when ready, with version control for changes.

### 3. Exam Delivery and Student Experience
- **Student Dashboard:** Vietnamese interface showing upcoming exams, available practice tests, and recent results.
- **Exam Interface:** 
  - Vietnamese instructions with LaTeX-rendered mathematical content
  - WebSocket-synchronized timer with 1-second precision and polling fallback
  - Auto-save functionality every 10 seconds
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
- **Automatic Grading:** Immediate scoring for objective question types with configurable partial credit.
- **Manual Grading:** Queue system for essay questions with admin grading interface.
- **Result Calculation:** Accurate score calculation with percentage and pass/fail determination.
- **Student Results:** 
  - Immediate feedback for practice tests with detailed explanations
  - Delayed feedback for formal exams as configured by administrators
  - Vietnamese result displays with clear score presentation
- **Admin Analytics:** Comprehensive result analysis with:
  - Per-exam statistics (average score, completion rates)
  - Per-question analysis highlighting difficult questions
  - Exportable result data for offline analysis

### 5. Anti-Cheating and Exam Integrity Measures
- **Event Logging Infrastructure:** Extensible system for tracking suspicious activities without affecting core MVP functionality.
- **Browser-based Deterrents:** 
  - Full-screen mode encouragement with focus tracking
  - Copy-paste restrictions on exam content
  - Right-click context menu disabling
- **Randomization:** Question and option order randomization per student session.
- **Secure Answer Handling:** Correct answers never sent to client-side until after exam completion.
- **Session Management:** Single device enforcement with automatic logout on duplicate sessions.
- **Time Analytics:** Unusual completion time flagging for admin review.

### 6. Scheduling and Notifications
- **Exam Scheduling:** Server-enforced availability windows with timezone handling.
- **Email Notifications:** Automated reminders using AWS SES for upcoming exams and result availability.
- **In-App Notifications:** Dashboard notifications for new exams, upcoming deadlines, and available results.
- **Time Zone Management:** Consistent time display using server timezone (UTC+7) with clear timezone indicators.

### 7. User Interface & Branding Requirements
- **Vietnamese Localization:** All user interface elements in Vietnamese with proper diacritics support.
- **GMATHS Branding:** Official logo placement and brand color scheme implementation throughout the platform.
- **Responsive Design:** Cross-browser compatibility (Chrome, Firefox, Safari, Edge) with mobile-first approach.
- **Mathematical Content:** Client-side LaTeX rendering using MathJax for questions and answers.
- **User Experience:** Clear navigation, intuitive form design, and consistent interaction patterns.

## Non-Functional Requirements

### Performance and Scalability
- **Concurrent Users:** Support 1,500 simultaneous users on AWS t2.small instance through optimized architecture.
- **Response Times:** Sub-2-second response times for most user actions under full load.
- **WebSocket Scaling:** Redis pub/sub for WebSocket scaling with efficient memory usage.
- **Database Optimization:** Proper indexing and query optimization using Prisma ORM.
- **Caching Strategy:** Redis caching for frequently accessed exam data and session management.

### Security and Data Protection
- **Data Transmission:** HTTPS encryption for all client-server communication.
- **Password Security:** bcrypt hashing with appropriate salt rounds for password storage.
- **Session Security:** Secure JWT implementation with Redis-backed refresh tokens.
- **Input Validation:** Comprehensive validation on both frontend (user experience) and backend (security).
- **Access Control:** Role-based authorization with proper route protection.
- **Audit Logging:** Security event logging for monitoring and incident response.

### Accessibility and Inclusivity
- **Basic WCAG Compliance:** Essential accessibility features implemented where convenient during development.
- **Keyboard Navigation:** Full keyboard accessibility for exam interface and navigation.
- **Screen Reader Support:** Semantic HTML structure with appropriate ARIA labels.
- **Visual Design:** Sufficient color contrast and resizable text support.
- **Responsive Layout:** Accessible design across different screen sizes and devices.

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

## Conclusion
This PRD provides a comprehensive blueprint for the GMATHS Education Online Testing Platform with clear technical constraints and implementation guidance. The focus on performance optimization for high concurrency, Vietnamese user interface, and extensible architecture ensures the platform meets both immediate needs and future growth requirements. The hybrid approach of essential features with extensible design allows for rapid MVP delivery while maintaining long-term scalability.