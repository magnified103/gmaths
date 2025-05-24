# GMATHS Online Testing Platform Implementation Plan

## Project Structure and Initial Setup

**Monorepo Structure:** We will enforce a strict project structure from day one to organize the codebase. The repository will be a monorepo containing separate folders for the backend (Fastify server) and frontend (Vite + React app), plus documentation and configuration. This structure aligns with Fastify’s recommended layering and is extended for a full-stack project. For example:

```

gmaths-platform/
├── backend/               # Fastify server (Node.js/TypeScript)
│   ├── package.json       # Backend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for backend
│   ├── src/               # Source code for Fastify server
│   │   ├── routes/        # Route definitions (e.g. auth, exams)
│   │   ├── plugins/       # Fastify plugins (e.g. auth plugin, Prisma client)
│   │   ├── services/      # Business logic (e.g. authentication, grading)
│   │   ├── models/        # Data models or ORM layer (Prisma schema in prisma/)
│   │   └── utils/         # Utility modules (helpers, validators, etc.)
│   ├── prisma/            # Prisma schema and migration files
│   │   └── schema.prisma  # Data model definitions (User, Exam, Question, etc.)
│   ├── tests/             # Backend unit/integration tests (Vitest)
│   └── .env               # Environment variables (DB URL, JWT secret, etc.)
├── frontend/              # Vite + React frontend (TypeScript)
│   ├── package.json       # Frontend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for frontend
│   ├── vite.config.ts     # Vite configuration (including test config)
│   ├── src/               # React application source
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Login, ExamList, TakeExam, Results, Admin)
│   │   ├── api/           # API interaction layer (fetch/axios wrappers)
│   │   └── App.tsx        # Application root
│   ├── tests/             # Frontend unit tests (Vitest + Testing Library)
│   └── public/            # Static assets (if any)
├── e2e/                   # End-to-end tests (Playwright)
│   └── tests/             # Playwright test specs for user flows
├── docs/                  # Documentation (MarkDown)
│   ├── README.md          # Overview and project introduction
│   ├── architecture.md    # Architecture decisions and diagrams
│   ├── auth.md            # Authentication feature docs (updated as built)
│   ├── exams.md           # Exams feature docs (API, data model, usage)
│   └── ...                # Additional docs for features, API reference, etc.
├── package.json           # Root workspace config (scripts to run both front/back tests, etc.)
└── .github/               # CI/CD workflows (added post-launch)
└── workflows/ci-cd.yml

````

This design cleanly separates concerns and allows parallel development of frontend and backend for each feature. The `backend/src` hierarchy follows Fastify best practices (routes, plugins, services, etc.). The `frontend/src` is a typical React structure (using React Router for navigation and React Context for global state where needed). A dedicated `docs/` directory ensures that documentation is first-class: every significant change will include updates to markdown docs (e.g., detailing new API endpoints or UI workflows).

**Initial Setup Steps:** 

1. **Backend Initialization:** Create the backend Node.js project and add core dependencies. For example, initialize npm and install Fastify:  
  ```bash
  cd backend  
  npm init -y  
  npm install fastify fastify-plugin @fastify/cors @fastify/jwt @fastify/formbody @fastify/static bcrypt dotenv  
  npm install -D typescript tsx @types/node vitest
  ```

* Generate a TypeScript config: `npx tsc --init` (target ES2020+, module commonjs/ESM as appropriate). Enable strict typing and path aliasing for clean imports.
* Install **Prisma ORM** and initialize it for our database:

  ```bash
  npm install prisma @prisma/client  
  npx prisma init --datasource-provider postgresql  
  ```

  This creates a `prisma/schema.prisma` file and sets up the connection in .env. We’ll configure the connection URL for our Postgres database in `.env` (for development, perhaps a local Postgres, and in production an RDS or local Postgres on EC2).

2. **Frontend Initialization:** Scaffold the React app using Vite (with a React TypeScript template for immediate TS support). For example:

   ```bash
   cd frontend  
   npm create vite@latest gmaths-frontend -- --template react-ts  
   cd gmaths-frontend  
   npm install  
   npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
   ```

   This uses Vite to create a React+TS project. We add Vitest and React Testing Library for unit tests. We’ll also configure `vite.config.ts` to include a testing section (setting the test environment to `happy-dom` or jsdom, and including a `setupTests.ts` to import `@testing-library/jest-dom` for DOM matchers). The frontend will use React Router (v6+) for navigation between pages (login, exam list, test, results, admin), and we can document routes in `docs/architecture.md`.

3. **Shared Config and Tools:** Set up a root workspace if using npm/Yarn workspaces so we can run commands across projects. For example, in the root `package.json` define workspaces for `backend` and `frontend`. Also, add convenience scripts: e.g., `"dev": "npm --prefix backend run dev & npm --prefix frontend run dev"` to run both dev servers together during development. We will use **ESLint** and **Prettier** configs (with possibly AirBnB or Standard presets) to maintain code quality (per Fastify tips). These configs and a pre-commit hook (using Husky) will be added early.

4. **Continuous Documentation:** Initialize the `docs/` folder with a basic README and skeleton files for features. We’ll treat documentation as code: for example, after setting up authentication, we’ll update `docs/auth.md` with API endpoints, request/response examples, and any setup (like password policies or email templates). We might use a simple Markdown approach or a generator (e.g., Docusaurus or Docsify) to later publish the docs, but the primary goal is to keep `.md` files updated in the repo. Every feature task includes a step to update relevant docs.

By completing the initial setup, we will have a boilerplate backend server ready (serving a “hello world” endpoint), a scaffolding for the React app, and all configurations (TypeScript, testing, environment files) in place. This foundation lets us proceed with TDD and feature implementation confidently.

## Test-Driven Development Workflow

We adopt **Test-Driven Development (TDD)** from the start, using **Vitest** for unit and integration tests and **Playwright** for end-to-end tests. This means for each feature, we **write tests first**, implement just enough code to make them pass, then refactor. The workflow ensures high coverage and catches regressions early.

* **Vitest Configuration:** Vitest is a Vite-native test runner that is blazing fast and supports TypeScript out-of-the-box. We add a script in each project’s package.json to run tests (e.g., `"test": "vitest"` in backend and frontend). For example, in the backend we might have `npm run test:backend` which runs Vitest on the backend tests, and similarly for the frontend. Vitest uses a Jest-like API (`test`/`it`, `expect`) so developers familiar with Jest can easily write tests. We will configure separate coverage thresholds for critical modules (like requiring higher coverage for authentication and exam grading logic). We also use **React Testing Library** in the frontend to test components and pages in isolation, ensuring the UI logic (form validations, state changes) works independently. These tests run in a headless DOM (via happy-dom or jsdom).

* **Fastify Integration Testing:** Fastify allows injecting HTTP requests directly into the app without real network calls. We leverage this in Vitest to test backend routes. For example, in `backend/tests/auth.test.ts` we will write:

  ```ts
  const app = buildFastifyAppForTest(); // our helper to configure fastify instance  
  test('POST /api/auth/register should create a new user', async () => {  
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'test@example.com', password: 'Pass1234' } });  
    expect(res.statusCode).toBe(201);  
    const data = JSON.parse(res.payload);  
    expect(data).toMatchObject({ email: 'test@example.com' });  
  });  
  ```

  Using Fastify’s built-in injection (from LightMyRequest) means we can test routes and logic without launching a live server. We will set up a test database (or use SQLite/postgres in-memory) for these tests and use Prisma’s ability to run against a test DB URL. Each test can run DB migrations in a setup step (or use Prisma to programmatically create the necessary data) and tear down by truncating tables. With Vitest, we can leverage `beforeEach`/`afterEach` hooks to reset state.

* **Playwright End-to-End Testing:** For full-stack tests simulating user behavior, we use Playwright. *“Playwright enables reliable end-to-end testing for modern web apps”*, supporting headless browsers and cross-browser checks. We will create Playwright test specs in the `e2e/tests` folder, covering critical user journeys: e.g., *“User registers, logs in, takes an exam, and views results.”* Each E2E test will start by launching the web app (we’ll have the dev server or a test build running) and automating a browser to click through the UI. Playwright’s auto-wait and web-first assertions help avoid flaky tests (e.g., it will wait for the page to load and elements to appear before interacting). We will configure GitHub Actions later to run these Playwright tests in headless mode on each push, ensuring the whole system works on CI (Playwright provides official GitHub Action support for easy setup).

* **TDD Practice:** For each feature (detailed in the next section), the development will start by writing a **failing test** (or tests) that specify the intended behavior. For example, for the login feature, we write a backend test expecting a 200 response for correct credentials and 401 for wrong password, and a frontend test that simulates a form submission and expects an error message for invalid login. Initially these tests fail (since the feature isn’t implemented). We then implement the minimal code (routes, functions, UI changes) to make these tests pass. This approach forces us to clarify requirements and edge cases upfront (e.g., “password must be hashed and verified”) and results in a robust test suite as a byproduct of development. We will maintain testing parity for backend and frontend – i.e., every API endpoint has corresponding tests, and every frontend page has rendering and interaction tests.

* **Continuous Integration of Tests:** While full CI/CD comes after launch, we will start integrating tests early. For example, we can have a simple **GitHub Action** (or just local pre-push hook) to run `npm run test` in both `backend` and `frontend`. This ensures that even before official CI, we don’t merge code that breaks tests. After the launch, a comprehensive CI pipeline will be set up to run unit, integration, and E2E tests automatically on each commit (detailed in [CI/CD Pipeline Setup](#ci-cd-pipeline-setup)).

By adhering to TDD and leveraging Vitest/Playwright, each feature will be built with correctness in mind and verified at multiple levels (function, API, and UI) before it’s considered “done.” This significantly reduces bugs and integration issues, and gives us confidence to deploy frequently.

## Iterative Full-Stack Feature Development

We will implement features in logical order, focusing on the **Minimum Viable Product (MVP) features first**, and always completing a feature end-to-end (database → backend → frontend → tests) before moving on. This vertical slice approach ensures that at any point, the frontend can use the newly added backend functionality immediately, and we can deploy incremental improvements. Below is the plan feature by feature, in priority order:

### 1. User Authentication (MVP Feature)

**Goal:** Implement full authentication capabilities: user registration, login (with JWT or session), and password reset. This establishes the foundation for secure access (students vs admins) and user-specific data.

**Backend – Authentication API:**

* **Data Model:** Add a `User` model in Prisma with fields for `id`, `email`, `passwordHash`, `name`, `role`, etc. For example, in `prisma/schema.prisma`:

  ```prisma
  model User {
    id           String   @id @default(uuid())
    email        String   @unique
    passwordHash String
    name         String?
    role         String   @default("student") // "admin" or "student"
    createdAt    DateTime @default(now())
    // ... possibly other fields like resetToken, resetTokenExpiry for password reset
    exams        Exam[]   @relation("ExamCreator") // exams created (if admin)
    submissions  Submission[]  // exams taken by user
  }
  ```

  We run `npx prisma generate` to update the Prisma Client with the new model.

* **Registration Endpoint:** Create a route `POST /api/auth/register` that accepts new user details. Implement a service function (e.g., `UserService.register(data)`) to validate input, hash the password (using **bcrypt** with a salt) and save the user via Prisma. Use Prisma Client to insert the user record. We ensure the email is unique (the database and Prisma will enforce this). On success, return a 201 status with the new user’s public info (e.g. ID and email). On duplicates, return 400. We will write unit tests for the hashing function and integration tests for the endpoint (using Fastify inject), e.g., expecting 201 for a new email and 409/400 for an existing email.

* **Login Endpoint:** Create `POST /api/auth/login` that verifies credentials. The handler will find the user by email (via Prisma), then use `bcrypt.compare(password, user.passwordHash)`. If match, generate a JWT token (or session cookie). We integrate **Fastify JWT** plugin for this. We register `@fastify/jwt` with a secret in our Fastify instance and use it to sign tokens. For example:

  ```ts
  fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });
  ```

  On login success, we can return a JWT in the response body (and client will store it) or, better, set it as an HTTP-only cookie. Fastify has a cookie plugin (`@fastify/cookie`) that we can use to set cookies on the reply. The decision: **For simplicity, we’ll return the JWT in JSON** (e.g., `{ token: <jwt> }`), and the frontend will store it (likely in memory or localStorage) and include it in `Authorization` headers on future requests. (Later, we could enhance to HttpOnly cookies for security.) We write tests expecting a 200 and a token for valid credentials, and 401 for invalid credentials.

* **JWT Protection:** Once login provides tokens, we secure future routes. We implement a Fastify *decorator* `authenticate` using **fastify-jwt** to verify tokens on protected routes. As shown in the fastify-jwt docs, we create a plugin that decorates the Fastify instance:

  ```ts
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  });
  ```

  Then we apply `preValidation: [fastify.authenticate]` on routes that require login. This ensures `request.user` is set to the token’s payload (e.g., user ID) for those handlers. We will use this on exam-taking and admin routes.

* **Password Reset (Forgot Password) Flow:** Implementing this in MVP ensures complete auth. This involves two parts:
  **(a)** *Request reset:* an endpoint `POST /api/auth/reset-password` that takes an email. If the user exists, generate a random **reset token** (could be a secure random string or a time-limited JWT with a separate secret/claim). Save this token and an expiration (e.g., 1 hour) in the database (e.g., add `resetToken` and `resetTokenExpiry` fields to User model). Then send an email to the user with a reset link containing the token. We will use **nodemailer** (SMTP) or an AWS SES integration to send emails. To keep things simple, we can start with nodemailer to an SMTP server or even just log the reset link in the server logs in dev. We’ll configure SMTP credentials via environment variables.
  **(b)** *Perform reset:* an endpoint `POST /api/auth/reset-password/{token}` that accepts the new password. It will verify the token (by looking up the user with that resetToken and checking expiry), then hash the new password and update the user’s passwordHash, and clear the resetToken fields. After success, we can optionally force a new login (invalidate old sessions if any, though since we use stateless JWT, it’s fine – the old JWT will be useless once password is changed if we embed something like password hash version in JWT, which we might not do now for MVP). We’ll test this flow: calling the first endpoint should generate a token, and calling the second with a valid token should change the password. (In testing, we might bypass the actual email sending by capturing the token from the DB.)

* **Testing:** We write comprehensive tests for auth:

  * Unit tests for password hashing (e.g., ensure `UserService.hashPassword('pass')` returns a different hash each time and matches when comparing).
  * Integration tests for each auth endpoint:

    * Register: returns 201 and user ID, cannot register duplicate email.
    * Login: returns 200 + token for correct credentials, 401 for wrong ones.
    * Protected routes: we’ll set up a dummy protected route in tests to verify that without token we get 401 and with token we get 200 and `request.user` is set. (Fastify’s JWT plugin automatically decodes to `request.user` after `jwtVerify()`.)
    * Reset password: call reset request, simulate email by extracting token from DB, then call reset confirm endpoint, and verify the password was indeed changed (e.g., login with new password works, old one no longer works).
  * Frontend tests: using React Testing Library, we will test that the Login page form calls the API and handles responses. We can mock the API calls in unit tests. Later, Playwright E2E will cover the real integration (e.g., running the backend and frontend and actually performing a login in a headless browser).

* **Frontend – Auth UI:**
  We will build a simple but clear UI:

  * **Registration Page:** A page with a form (email, name, password, confirm password). On submit, it calls `POST /api/auth/register`. If success, maybe auto-login or redirect to login page with a success message. If error (e.g., email taken), display message. We will use React state to manage form inputs and possibly a library like **React Hook Form** for form handling/validation (to enforce password complexity or matching passwords). This is optional; initial implementation can manage state manually. Tests will verify validation (e.g., show error if password < 8 chars) and that API errors are displayed.
  * **Login Page:** A form for email & password. On submit, call login API. On success, store the JWT (likely in `localStorage` or an in-memory context) and set an auth context state as logged-in, then redirect the user (if admin, to admin dashboard; if student, to exam list). We use React Router’s `<Navigate>` or `useNavigate` for redirects. On failure, show an error message. We’ll write a test that simulates entering wrong credentials and ensures an error is shown.
  * **Reset Password Pages:**

    * “Forgot Password” page: a form to input email and request a reset. On submit, call the reset request API. Show a confirmation message like “If an account with that email exists, a reset link has been sent.” (This avoids exposing whether the email exists.)
    * “Reset Password” page: when the user clicks the link in email (`/reset-password?token=XYZ` or a dedicated route with token), the front-end shows a form for new password. On submit, call the reset confirm API. If success, show “Password updated, please log in.” and redirect to login. If token is invalid/expired, show an error and possibly offer to resend. This front-end flow requires parsing the token from URL (React Router can handle query params or path params).
  * We ensure the auth pages have a consistent design (using a simple CSS framework or component library if desired – e.g., we can use **Chakra UI or Material-UI** for quick styled components). However, styling is secondary to functionality in the MVP, so basic HTML/CSS with responsive layout is acceptable.

* **Documentation:** Update `docs/auth.md` with details: API endpoint documentation (methods, URLs, sample request/response JSON, error codes), as well as any configuration (for instance, note that you must set `JWT_SECRET` in .env, and SMTP settings for password reset emails). Also, in `docs/architecture.md`, document the use of JWT for stateless auth and mention future considerations (like using refresh tokens or cookies, but for MVP we keep it simple).

By completing authentication first, we enable user-specific behavior and secure admin vs student access. We will deploy the system at this point (see **Deployment** below) to a staging environment to verify that the basic auth system works on AWS (e.g., ensure emails can be sent from the server, etc.) before proceeding.

### 2. Exam Management (Admin) – MVP Feature

**Goal:** Allow admins to create and manage exams (tests). This includes creating exams with questions and answer options, editing them, and listing exams. This feature is accessible only to admin users and lays the groundwork for students to take exams.

**Backend – Exam/Question Models & API:**

* **Data Modeling:** Extend `schema.prisma` with exam-related models. We propose:

  ```prisma
  model Exam {
    id          String    @id @default(uuid())
    title       String
    description String?
    creator     User      @relation("ExamCreator", fields: [creatorId], references: [id])
    creatorId   String
    questions   Question[]  
    published   Boolean   @default(false)  // if exam is ready for students
    createdAt   DateTime  @default(now())
  }
  model Question {
    id         String   @id @default(uuid())
    exam       Exam     @relation(fields: [examId], references: [id])
    examId     String
    text       String
    type       String   @default("multiple-choice") // "multiple-choice" or "text"
    options    Option[] 
  }
  model Option {
    id         String   @id @default(uuid())
    text       String
    isCorrect  Boolean  @default(false)
    question   Question @relation(fields: [questionId], references: [id])
    questionId String
  }
  ```

  This structure covers multiple-choice questions. If we need other question types (e.g., open-ended text), the `Question.type` can differentiate and we might not use the `Option` model for text questions. For MVP, we primarily support multiple-choice questions (since auto-grading is straightforward). We run `prisma migrate dev --name add_exam_models` to generate a migration SQL and apply it to the dev database.

* **Admin Authorization:** All exam management routes will require an admin user. We enforce this by checking `request.user`’s role. Our JWT payload will include the user’s role (when creating the token at login). Then, for admin routes, we add a check after `request.jwtVerify()`: e.g., `if (request.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' })`. We might implement this as a Fastify pre-handler hook or simply in each route handler for simplicity.

* **Create Exam API:** `POST /api/exams` (admin-only). The request body can contain exam title, description, and an array of questions with options. Example payload:

  ```json
  {
    "title": "Algebra Basics",
    "description": "Basic algebra test",
    "questions": [
      {
        "text": "2+2 = ?",
        "options": [
          { "text": "3", "isCorrect": false },
          { "text": "4", "isCorrect": true },
          { "text": "5", "isCorrect": false }
        ]
      },
      { 
        "text": "Solve for x: 5x=20",
        "options": [
          { "text": "4", "isCorrect": true },
          { "text": "5", "isCorrect": false }
        ]
      }
    ]
  }
  ```

  The backend will create the Exam, then create each Question and its Options in the database. We may implement this in a service method `ExamService.createExam(examData, userId)` to handle the transaction (ensuring all-or-nothing). Prisma can create nested writes (e.g., create exam and questions in one call) but explicit creates inside a transaction will give us more control to catch errors. We will validate input: at least one question, each question with at least one option, etc. On success, return 201 and the created exam’s ID (and maybe a summary of counts). Tests will include sending invalid data (e.g. no title or a question with no correct answer) to ensure validation works.

* **Edit Exam API:** `PUT /api/exams/{id}` (admin-only). Allows updating title, description, questions, etc. Editing could be complex (especially modifying questions/options). To simplify, we can decide MVP doesn’t require full edit of questions – the admin could delete and recreate an exam if needed. But a more user-friendly approach: allow adding or removing questions and options. We can implement update by deleting removed questions/options and creating new ones as needed, or use Prisma upsert operations. Given time constraints, we might implement partial updates (e.g., title/description toggle published status) and leave question editing as a post-MVP improvement. We will at least implement the ability to mark an exam as published (so students can see it) or to delete an exam (if no one has taken it yet). We’ll document any limitations (e.g., “questions cannot be edited after creation in this version”).

* **List Exams API:**

  * `GET /api/exams` for admin – returns all exams with summary info (we might exclude the correct answers in this list for security, or only include them for admin).
  * `GET /api/exams/{id}` – returns full details of a single exam (including questions and options). For admin, this can include which option is correct; for students (when they take exam), the API will **not** mark the correct answer in responses to prevent cheating (the correctness is checked server-side on submission).
  * Possibly filter by published or by creator, but since only admins create exams, the admin sees all. For students, there will be another endpoint (in the next feature) to list only published exams they can take.

* **Testing:** We write tests for exam creation (happy path: exam created, questions and options persisted; edge cases: missing title -> 400, not admin -> 403, etc.). We’ll use the JWT of an admin user in the Authorization header of inject requests to simulate an admin calling the API. We also test listing endpoints (create some sample exams via Prisma directly or via the API, then fetch and verify the JSON structure). We should also test that a student JWT cannot create or edit exams (gets forbidden).

* **Frontend – Admin UI:**
  We create an **Admin Dashboard** section, accessible only to logged-in admins. This will likely include:

  * **Exam List (Admin):** A page that lists all exams (title, number of questions, published/draft status). Each item might have buttons: *Edit*, *Publish/Unpublish*, *View Results*. We’ll call `GET /api/exams` to populate this. We can reuse this data to also show some quick stats (like “X questions”).
  * **Create Exam Form:** A page or modal for creating a new exam. Using a dynamic form where admin can add multiple questions. We might implement this page with local state to build up the exam object:

    * Fields for title, description.
    * UI to add a question: text input for question, select for type (only multiple-choice for now), and inputs for options (text plus a checkbox or radio to mark correct option). The admin can click “Add Option” to append more choices, and “Add Question” to add another question section.
    * On submit, the form calls the create exam API. After creation, redirect back to Exam List or directly to an Exam Detail page.
    * We will heavily validate the form on client side: e.g., require a title, require at least one question with at least one correct option, etc., to avoid sending bad data.
    * Testing: we will write component tests to ensure that adding/removing questions in the form works (simulating user clicks), and that the form shows validation errors if, say, no correct option is selected.
  * **Edit/Publish:** On the exam list, an admin can toggle publish status. We implement a quick action (e.g., a “Publish” button that calls `PUT /api/exams/{id}` with `{ published: true }`). Or incorporate this in the Edit Exam screen. To simplify, we might allow toggling published from the list for MVP. Editing questions might not be fully implemented (if time doesn’t permit). We’ll clearly document that in MVP, exam questions are essentially static after creation.
  * **Results (Admin View):** Possibly not in this feature yet, but we anticipate an admin might want to view results of each exam. We leave detailed results for the Results feature, but in the admin’s exam list, we can have a “View Results” link that navigates to a page (to be built later) listing student submissions. We stub this for now (so the button can exist but page might say “Not implemented yet” or similar).

* **Documentation:** We update `docs/exams.md` with API details (create, list, etc.), including the JSON schema of the exam creation payload (so it’s clear how questions/options are structured). We also note that this is an admin-only feature (and possibly mention how the system identifies admin: e.g., the first registered user might be flagged as admin in dev, or we manually set in DB; for now, we can allow a quick config like environment variable for an admin email to simplify or just manually update the DB).

At this stage, we will deploy the updated application to AWS again, now including the exam functionality. This acts as **Deployment Checkpoint 1**. We’ll ensure that:

* The database migrations run successfully on the server (creating Exam, Question, Option tables). If using a remote DB (RDS), we run `prisma migrate` as part of deployment.
* The admin UI is accessible and the admin can create an exam and see it listed.
* The JWT auth still works end-to-end with these new routes (i.e., our JWT decoding on the server is correct).
* This deployment lets us test via the real front-end (maybe using the EC2’s IP or domain) that everything up to exam creation is functional in a production-like environment.

### 3. Test-Taking Flow (Student) – MVP Feature

**Goal:** Enable students to take exams and see their results. This includes listing available exams (published ones), presenting the exam questions, submitting answers, auto-grading, and storing results.

**Backend – Taking Exams API:**

* **List Available Exams:** `GET /api/my/exams` (student endpoint) – returns the list of exams that a student can take. Initially, this could be all exams with `published=true`. Later, we might have assignments or prerequisites, but MVP assumption: any published exam is available to any logged-in student. The response will contain basic info (id, title, description, maybe whether the student already took it or not). No correct answers are included.

* **Fetch Exam Detail:** `GET /api/exams/{id}/take` – returns the exam with questions and options *for taking*. This is similar to the admin’s get exam, but crucially, we do NOT include which option is correct in the payload (and possibly exclude certain admin-only fields). We may even choose not to send the `isCorrect` field at all to the client for options. The backend could omit it in the JSON serialization for this route. This ensures the student can’t inspect the network response to find answers. This route is protected (requires login), and we should ensure the exam is published (if an ID of an unpublished exam is requested by a student, return 404 or 403).

* **Submit Answers:** `POST /api/exams/{id}/submit` – student submits their answers for grading. The request will contain the exam ID (also in URL) and the answers, e.g.:

  ```json
  {
    "answers": [
      { "questionId": "Q1_UUID", "optionId": "O3_UUID" },
      { "questionId": "Q2_UUID", "optionId": "O5_UUID" }
    ]
  }
  ```

  (If we had text questions, an answer might contain a free-form text instead of an optionId.) The backend will verify that the exam exists and is published, and possibly that the student has not taken it before (for MVP, we can allow multiple attempts or choose to restrict one attempt per user – we’ll assume one attempt for now and enforce uniqueness of Submission per user+exam). We then grade the answers: for each answer, check if the selected option’s `isCorrect` is true. Calculate a score (e.g., number of correct answers or percentage). Save a **Submission** record and related Answer records in the database:

  ```prisma
  model Submission {
    id        String   @id @default(uuid())
    exam      Exam     @relation(fields: [examId], references: [id])
    examId    String
    student   User     @relation(fields: [studentId], references: [id])
    studentId String
    score     Float?
    takenAt   DateTime @default(now())
    answers   Answer[]
  }
  model Answer {
    id           String    @id @default(uuid())
    question     Question  @relation(fields: [questionId], references: [id])
    questionId   String
    submission   Submission @relation(fields: [submissionId], references: [id])
    submissionId String
    selectedOptionId String?  // which option the student chose (null for open-ended Q)
    selectedOption   Option? @relation(fields: [selectedOptionId], references: [id])
    textAnswer    String?    // if open-ended, store answer text
    isCorrect     Boolean?   // store correctness for quick querying
  }
  ```

  (If time is short, we can simplify by not storing each answer, just store score and maybe a blob of answers, but ideally we store for future review and for giving feedback per question). We populate the `isCorrect` for each Answer when saving, for easy retrieval. After saving, return a result to the client, e.g. `{ score: 8, outOf: 10 }` or `{ percentage: 80, passed: true/false }`. We define passing criteria if needed (maybe not for MVP, or a constant like 50%).
  We must ensure security: the grading should not trust the client’s input beyond the chosen option IDs (i.e., even if a malicious client tried to mark an option as correct in the payload, we ignore that and compute based on server data). Because we fetch the `Option.isCorrect` from DB for grading, this is secure.

* **View Submission Result:** After submission, the student can retrieve their result. We have options: return result immediately in the submit response (likely we do that), and/or have a `GET /api/my/submissions/{submissionId}` to get details. MVP can just return the score in the submit response to simplify. If we want to allow viewing past results, implement `GET /api/my/results` listing past submissions by the user, or include a flag in exam list if already taken.

* **Testing:** We will test the grading logic with various scenarios: all correct answers vs some incorrect. We’ll create a sample exam in the test (or use the API to create one), then simulate a student submitting answers. We verify that the score is calculated correctly and that a Submission record is created. Also test for edge cases: submitting to an exam that doesn’t exist or isn’t published (should 404/403), and double submission (if we restrict one attempt, the second attempt could be rejected with 409 Conflict or similar). We also test that an unauthenticated request to submit is rejected (401), and a user cannot submit as another user, etc.

* **Frontend – Student UI:**
  We build the student-facing views:

  * **Exam Catalog:** When a student logs in, they see a list of available exams (title, description). This is fetched from `GET /api/my/exams`. For each exam, show if it’s available or maybe if taken (if we track that). They can click “Start” to take the exam. We’ll likely implement this as the home page for a logged-in student.
  * **Take Exam Page:** When starting, route to `/exam/{id}`. This page will fetch exam details (`GET /api/exams/{id}/take`). It then renders the list of questions with multiple-choice options (as radio buttons, since presumably one correct per question). We could show all questions on one page (simplest approach) or one question at a time. MVP will show all questions at once to avoid building a complex wizard UI. The student selects answers and clicks “Submit”. We handle form state with React (store chosen option for each question in state).
  * On submit, call the submit API. On success, navigate to the **Results Page** for that exam attempt.
  * **Exam Result Page:** After submission, show the student their score, and possibly a breakdown (which they got right/wrong). We have the data since we stored correctness per answer. For MVP, we can show simply “You scored X out of Y”. If we want to show which ones were wrong, the backend could include in the submit response an array of question IDs that were wrong (or the whole answers with isCorrect). We’ll likely implement a `GET /api/exams/{id}/result` for a student’s latest submission to retrieve detailed results (to avoid sending too much data in the initial response). But to keep it simple, we might embed minimal info in the response and not implement a separate fetch.
  * We must ensure that if a student tries to access an exam page they’ve already taken (if only one attempt allowed), we handle that. Possibly we prevent it in UI by not showing “Start” again, or the backend returns a message. For MVP, it’s okay to not strictly enforce unique attempt (they could retake, perhaps overwriting the previous submission or creating multiple submissions – we can allow multiple attempts in MVP for simplicity and note it in docs).
  * **UI/UX considerations:** We’ll add some confirmation modals (e.g., “Are you sure you want to submit?”) to avoid accidental submissions, and maybe a timer if needed (though timed exams are not in MVP scope explicitly). We’ll ensure responsiveness so that if a student is on mobile, it’s still usable (simple CSS flex column layout, etc.).
  * **Testing:** Using Vitest + Testing Library, we test the exam page component logic (e.g., if no option selected for a question and submit is pressed, perhaps we warn that all questions must be answered – or we allow blanks as wrong answers). We simulate selecting options and call a mock submit function to see that the payload is correct. We also test the results component given some score input.
  * **Playwright E2E:** We will have a test like: register a new user, login, take an exam (we can seed the exam via API or have a known exam in the test DB), answer questions, and verify that the final score is displayed. This end-to-end test covers the entire system integration.

* **Documentation:** Update `docs/exams.md` or create `docs/test-taking.md` to describe how the test-taking works. Include example API calls for listing exams and submitting answers. Document that scores are calculated automatically and that currently any registered user can take any published exam. If applicable, mention that multiple attempts are allowed in this version (or if not, describe the restriction).

By finishing the test-taking flow, we have a complete MVP: an admin can create exams, students can take them, and both can see results. We will perform another deployment at this point (**Deployment Checkpoint 2**) to ensure all these features run on the AWS environment. This will include running database migrations for new tables, and verifying that larger payloads (exam data) work in the deployed setting (adjusting any Nginx or Fastify body size limits if necessary via configuration).

### 4. Results and Basic Analytics (MVP Feature)

**Goal:** Provide mechanisms to view exam results. Students should see their own results (immediately after submission and possibly a history), and admins should see aggregated results for each exam.

**Backend – Results APIs:**

* **Student’s Past Results:** `GET /api/my/submissions` – returns a list of submissions the logged-in student has made (exam id, title, score, date). This allows a student to review what exams they took and their scores. (If we allowed multiple attempts, it would list each attempt.) For MVP, this is a nice-to-have; the primary result view is right after taking the exam. We implement this if time permits. If not, we ensure the immediate result is shown and note that persistent history can be viewed via admin for now.

* **Admin Results:** `GET /api/exams/{id}/submissions` – admin-only, get all submissions for a given exam. Include user name/email and score. This lets the admin see how students performed. We can also implement basic aggregation on the fly, e.g., average score, pass rate. These stats could be computed in code or via a SQL query using Prisma (e.g., use `aggregate` to compute avg). For MVP, listing each submission may suffice.

* We also consider a `GET /api/exams/{id}/submissions/{submissionId}` to get detailed answers of a single attempt (to allow manual review if needed). That can be done post-MVP if needed (especially for open-ended questions which are out-of-scope for auto-grade).

* **Certificate generation (postponed)** is related to results (issue certificate if passed), but since it’s postponed, we will not implement it now. We do keep the data needed (we have user, exam, score) to implement it later with a PDF generator.

* **Testing:** For results, we’ll create a fake submission or use the flow to generate one, then test that admin can retrieve it and student can retrieve their own but **not** others. We test that unauthorized access is prevented (e.g., one student cannot fetch another student’s submission data by guessing an ID – our route design using `my` or checking userId will prevent that). For any aggregation calculations, test correctness (e.g., if 3 submissions with scores, the average is computed right).

* **Frontend – Results UI:**

  * **Student View:** After finishing an exam, the student sees the score immediately (already implemented in the Take Exam page flow). Additionally, we can provide a “My Results” page where a student can see a list of past exam results. This page calls `GET /api/my/submissions` and displays a table (Exam name, score, date). It’s a convenience, not strictly required by PRD, but it’s a logical addition if time allows. We will include it for completeness so students can always review their performance.
  * **Admin View:** Expand the Admin Dashboard to allow clicking an exam to view results. For example, from the exam list, an admin clicks “View Results” on an exam. That navigates to `/admin/exams/{id}/results` page. On load, it calls the admin results API to get all submissions. The page displays a table of student name/email and score. We can show average score and possibly distribution (if we want to be fancy, but MVP can skip charts). If needed, allow exporting results as CSV (post-MVP feature perhaps).
  * These pages should be protected on the frontend as well (the router can check the user’s role from context and block navigation if not admin, etc., to complement backend security).
  * **Testing:** We test that the admin results page correctly displays a list of submissions after an exam is taken. This might involve using a mock response with some fake submission data in a component test. E2E wise, after an exam is taken by a student, we could login as admin (with Playwright, or just ensure admin created that exam and then see results) to verify the admin interface shows that submission. That might be more complex E2E, but we can simulate it if time permits (or just rely on integration tests for now).

* **Documentation:** Update documentation to describe where results are visible. E.g., in `docs/exams.md` or a separate `docs/results.md`, write that admins can view exam results and students get immediate feedback. If any formula or pass criteria exists, document that (for now, likely just raw score).

With results in place, the MVP feature set is complete. We should have: **Authentication**, **Exam Management**, **Test Taking**, and **Results** functioning end-to-end. All critical user stories are satisfied. The system should be usable in a real setting for basic exams.

At this point, we plan the **Launch Milestone** steps to deploy the MVP for actual use.

## Deployment Strategy and Launch Milestone

We will deploy the application early and often throughout development to a **t2.small AWS EC2 instance** (Linux) using the provided IAM credentials. Early deployments (at feature checkpoints) help catch environment issues and ensure that by the time we reach launch, we have a proven deployment process. The deployment approach is as follows:

* **Infrastructure Setup:** The EC2 (t2.small) will run both the Node backend and serve the frontend. We will configure Ubuntu on EC2 with:

  * Node.js (18+ LTS) installed (via nvm or apt).
  * A PostgreSQL database. Options: either use Amazon RDS (preferred for reliability) or install Postgres on the EC2 instance itself. Given a single t2.small, a lightweight RDS (db.t2.micro) might be better for production. For MVP launch, if RDS setup is feasible with provided IAM, we do that and set the DB URL in the server’s .env. If not, we install Postgres locally on EC2 and configure it to accept local connections only for security (update `pg_hba.conf` accordingly).
  * **Nginx** as a reverse proxy (and static file server). We will set up Nginx to listen on port 80 (and 443 if SSL is set up). It will forward API requests to the Node backend (e.g., incoming requests to `/api/*` proxy to `http://localhost:3000/api/*`). It will also serve the static frontend: after building the React app, we will have a `frontend/dist` directory with static files (HTML, JS, CSS). Nginx can be configured to serve those on the root path. This way, we achieve a clean separation: Nginx handles client assets and SSL, Fastify handles API under `/api`. We’ll include an Nginx config in the docs for reference.
  * **Process Manager:** Use **PM2** or a systemd service to keep the Fastify process running. PM2 is easy: we can start the app with `pm2 start backend/dist/index.js --name gmaths-backend --watch` (watch mode auto-restarts on file change if we deploy new files). We will configure PM2 to start on boot (via `pm2 save` and `pm2 startup`).

* **Deployment Process:** Until CI/CD is set up, deployments will be manual or semi-automated:

  1. **Build** the projects: On a development machine (or CI runner), run `npm run build` in frontend and backend. This yields a `backend/dist` (compiled server code) and `frontend/dist` (static web files).
  2. **Transfer** the build artifacts to EC2. This can be done with scp/rsync. We have a provided IAM, likely with an SSH key. We store the private key in our local environment or CI secrets. For example, we can use an rsync command (or a GitHub Action) to sync files. A sample from a guide: use `burnett01/rsync-deployments@5.1` GitHub Action to rsync `./backend/dist` and `./frontend/dist` to the server. Alternatively, simply push the entire repo and build on the server.
  3. **Install dependencies on server:** Ensure `node_modules` are installed. We might not want to rsync node\_modules due to size. Instead, we can install on the server. For a smoother process, we could containerize the app, but given the scale, a simple Node app is fine. We will have to also run `prisma migrate` on the server during initial setup to create the schema in the prod database.
  4. **Start/Reload** the server process: If using PM2, after new code is in place, run `pm2 restart gmaths-backend` (or start if first time). PM2 with `--watch` can auto-reload when files change, which aligns with using rsync deployments (as shown in the Medium guide).
  5. **Frontend deployment:** Nginx serves `frontend/dist`, so we need to copy those files to, say, `/var/www/gmaths/frontend/` and make sure Nginx root is pointed there. Alternatively, we can serve the static files via Fastify's `@fastify/static` plugin if Nginx is not used. However, using Nginx is more production-ready. For MVP launch, we’ll proceed with Nginx as it also simplifies adding SSL. We’ll document the Nginx config (mapping `/` to the `index.html` in that folder, and proxying `/api` to the Node app on port 3000, and possibly `/docs` to some docs if we host them).
  6. **Domain & SSL:** If a domain is available, map it via Route53 or the provider to the EC2’s IP. We’ll use Let’s Encrypt (Certbot) to get an SSL certificate, and configure Nginx to use it (HTTPS). If domain setup is not ready by launch, we can launch with just HTTP on an IP for internal testing, but for actual usage, HTTPS is critical (especially since login credentials are transmitted).
  7. **Environment Variables:** On EC2, we’ll store secrets (DB URL, JWT secret, possibly email SMTP credentials). These can be in the `backend/.env` file or exported in the PM2 config. Ensure these are set before starting the app. We will not store real secrets in code or repo.

* **Launch Checklist:**
  Before declaring launch, we will:

  * **Run full end-to-end tests on production URL:** Use Playwright to run tests against the deployed URL (we can parameterize our tests to point to a remote server). This ensures that not only our local environment, but the actual deployed environment is functioning (e.g., hitting the EC2 URL to register a user, take an exam, etc., should work).
  * **Basic Monitoring:** Set up monitoring for the system’s health. At minimum, create a simple `/api/health` endpoint in Fastify that returns OK and perhaps some info (DB connection ok, version). We can use an external service like UptimeRobot to ping this endpoint periodically. Also, configure AWS CloudWatch alarms: enable EC2 monitoring for CPU, memory, and if possible, integrate CloudWatch Logs for the application logs (we can ship PM2 or Fastify logs to CloudWatch by installing the CloudWatch agent on EC2). We’ll set an alarm to notify (via email) if CPU is high or if the instance is down. These steps ensure we know quickly if the app crashes or becomes unresponsive.
  * **Logging and Error Tracking:** Ensure Fastify’s logger is enabled (we initialized Fastify with `{ logger: true }` in production). This will log requests and errors to console. We’ll rotate these logs via logrotate or rely on PM2’s log management. Additionally, consider adding a third-party error tracking (post-launch item, e.g., Sentry) if needed for long-term.
  * **Security review:** Check that all relevant security measures are in place: passwords are hashed, JWT secret is long and stored safely, CORS is configured (using `@fastify/cors` to allow the front-end origin if served on a different domain), and all protected routes indeed require auth. Also ensure no sensitive information is returned in APIs (e.g., password hashes never leak).
  * **Documentation:** Finalize user guides in the `docs/` folder so that admins know how to create exams and interpret results, and a brief guide for students to take tests. Also include a README with setup instructions if someone else were to deploy the app (covering environment variables and migration commands).
  * **Performance check:** t2.small is limited, so we do a basic load test with a tool or manually (maybe simulate 10 students taking a test at once) to ensure it handles it. Fastify is quite performant, and our workload (mostly CPU for grading, minimal) should be fine on t2.small. If any endpoint seems slow (e.g., large exam submissions), we’ll note potential optimizations (like adding DB indexes or optimizing queries via Prisma).

**Launch Day Deployment:** We will deploy the final version following the tested process. After deployment, we verify once more end-to-end: register an admin, create an exam, register a student, take the exam, view results – all in production. Once verified, the platform is officially “launched.”

We then tag this release in our version control (e.g., Git tag `v1.0.0`) and treat the main branch as production-ready. The next steps involve maintenance and the postponed features.

## Post-Launch Enhancements

With the MVP live, we will shift to improving the platform with additional features and infrastructure enhancements that were deferred. We will also implement a proper CI/CD pipeline now that we have a stable baseline.

### CI/CD Pipeline Setup (post-launch)

After launch, we prioritize setting up Continuous Integration and Continuous Deployment using **GitHub Actions** to streamline future development:

* **Continuous Integration (CI):** We create a workflow (YAML file in `.github/workflows`) that triggers on pushes and pull requests to the main branch. The CI steps include:

  1. **Checkout code:** `actions/checkout@v3`.
  2. **Set up Node:** Use `actions/setup-node@v3` to install Node 18.x on the runner, and configure caching for `node_modules`.
  3. **Install dependencies:** If using workspaces, running `npm install` at root should install both frontend and backend deps. Alternatively, install each separately (`npm --prefix backend install && npm --prefix frontend install`).
  4. **Run tests:** `npm run test` at root (which we can set up to run both frontend and backend tests). We might define in root package.json: `"test": "npm run test -w backend && npm run test -w frontend"` if using workspaces. This runs Vitest suites. Then run Playwright tests. Playwright tests need the app running; we can either start the backend and frontend in the background (perhaps using `&` or use a tool like `start-server-and-test` to boot the server, then run Playwright). However, a simpler approach: for CI, we run only unit/integration tests (fast) on each push, and maybe schedule nightly full Playwright runs or run Playwright on deployment only. Initially, we can include Playwright in CI if not too slow (maybe using `Microsoft Playwright Action` which sets up browsers). This ensures every commit is tested thoroughly.
  5. **Artifacts & Coverage:** Configure the pipeline to upload test coverage reports or build artifacts if needed (not critical for now, but nice for QA).

* **Continuous Deployment (CD):** We extend the GitHub Actions workflow to deploy to AWS EC2 after tests pass (on the main branch). Using the IAM’s credentials or more securely an SSH key:

  * Add the EC2’s SSH key (private) as a secret in GitHub (e.g., `EC2_SSH_KEY`). Also the host, user, and path as secrets.
  * Use a deployment step. For example, as shown in a guide, use an action for SCP/SSH. One approach is using `appleboy/ssh-action` to run commands on the EC2 and `appleboy/scp-action` to copy files. Another is the `rsync-deployments` action as in the Medium example. We can do:

    ```yaml
    - name: Deploy to EC2
      uses: burnett01/rsync-deployments@5.1
      with:
        switches: -avzr --delete
        path: "backend/dist/ frontend/dist/ package.json prisma/schema.prisma"
        remote_path: "/var/www/gmaths-app/"
        remote_host: ${{ secrets.EC2_HOST }}
        remote_user: ${{ secrets.EC2_USER }}
        remote_key: ${{ secrets.EC2_SSH_KEY }}
    - name: Restart PM2
      uses: appleboy/ssh-action@v0.1.6
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USER }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /var/www/gmaths-app/
          npm install --omit=dev
          npx prisma migrate deploy   # apply any new migrations
          pm2 restart gmaths-backend || pm2 start dist/index.js --name gmaths-backend
    ```

    This is an illustration: the first step syncs the build and necessary files to the server (we assume we built the project in CI with `npm run build` before this step). The second step logs into the server and runs commands: install deps (if needed, or we might include node\_modules in sync to save time), run any pending migrations (`prisma migrate deploy` applies new migrations in prod), then restart the PM2 process (starting it if not already running). We would also ensure static files are placed where Nginx serves them (maybe `/var/www/gmaths-app/frontend` or symlink). This automated pipeline means every push to main can go live within minutes, greatly accelerating the development cycle.
  * We will protect this so that maybe only merges to a `release` branch trigger actual deploy if we want a manual gate. But since it’s a small team, automated deploy from main is fine after launch (especially as we maintain good tests).

* **Pipeline Testing:** We’ll test the pipeline by doing a dummy commit post-launch and verifying the Action runs through (we’ll watch the logs in GitHub Actions for any failures in SSH or PM2 steps, adjusting as needed – e.g., ensure the SSH user has correct permissions on the target directories, etc.). Once working, this pipeline will be documented in `docs/deployment.md` with explanation of each step and how to troubleshoot.

Having CI/CD in place will allow us to confidently tackle the remaining features, knowing that tests and deployment are taken care of.

### Additional Features (post-launch, in order)

With the platform launched and stable, we can gradually introduce the more advanced features that were postponed. Each of these will be developed in its own branch with the same rigorous approach (TDD, full-stack slices, documentation updates) and deployed via the CI/CD pipeline when ready:

1. **Anti-Cheating Measures:** Implement features to deter cheating during tests. For example:

   * **Full-screen mode & Focus detection:** Use the Screenfull JS library or the browser Fullscreen API to force fullscreen on exam start, and detect if the user switches tabs or windows (Page Visibility API). If a student leaves the exam window, we can log an event or warn them. This would involve front-end code (event listeners for `visibilitychange`) and possibly send a notification to the backend or just record it in the submission (e.g., increment a `violations` count). We will document this in the exam instructions for students.
   * **Disable copy-paste:** Add front-end scripts to disable right-click, copy (Ctrl+C), and perhaps use CSS to prevent text selection on questions. This is not foolproof but is a deterrent.
   * **Randomize question order or option order:** To make cheating harder if two students are side by side. This can be done by the backend sending questions/options in random order for each request (or the frontend randomizing). This is a minor tweak but effective.
   * Each of these sub-features will be tested (e.g., unit test any util functions, manual test that copy-paste is indeed blocked).
   * These do not require DB changes, mostly front-end and some integration.

2. **Optional Exam Types:** Extend exam model to support different exam configurations:

   * Timed exams: add a duration field to Exam, and on front-end enforce a countdown timer. The back-end can note the end time but mainly front-end enforcement is used. We’d use something like setting a timer when exam is fetched. Ensure submission after time expiry is either prevented or marked late (MVP of this feature: just warn and auto-submit when time’s up).
   * Question types: implement open-ended questions fully. This requires storing the student’s text answer and giving admins a way to grade them (since auto-grading is not possible for essays). Possibly, for open-ended, we mark `Answer.isCorrect = null` to indicate needs grading. Then build an admin UI to review submissions and manually mark correctness or assign points. This can be an involved feature (almost a small grading module), so it might come after easier ones.
   * File upload questions: if needed (probably not in initial scope, but PRD said “optional exam types” which could mean practical exams or different question formats).
   * We will prioritize timed exams first (since that’s commonly requested), then open-ended questions.

3. **Calendar Integration:** For scheduling exams or syncing with personal calendars:

   * Possibly allow admins to set a date/time for an exam (start and end window). This means the exam is only available between those times. We’d add fields to Exam (startTime, endTime) and enforce in backend (don’t allow `GET /take` or `POST /submit` outside the window). On front-end, show upcoming exams and a countdown.
   * Integration with Google Calendar or Outlook: allow an admin to click “Add to Calendar” which provides an .ics file or uses Google Calendar API to create an event for all students (if emails known) – this might be complex. Alternatively, each user can click to add the exam schedule to their own calendar. We can generate an .ics file dynamically (which is straightforward) for the exam schedule.
   * This feature mostly affects admin UI (setting the schedule) and some backend logic, plus generating calendar links. We’ll design it when we get there, focusing on not impacting existing flows (if an exam is scheduled, listing should indicate if it’s not yet open or already closed).

4. **Certificate Generation:** When a student passes an exam, generate a PDF certificate.

   * Define “passing”: likely admin sets a passing score per exam (add `passingScore` to Exam model or default 50%). If the student’s score >= passingScore, they pass.
   * Use a library like **pdfkit** or **Puppeteer** (to render an HTML template of a certificate and print to PDF) to generate a certificate file (with student name, exam title, date, score, maybe a verification code).
   * Provide an endpoint `GET /api/exams/{id}/certificate` for a student’s passing submission, which returns the PDF (with appropriate auth). Or simply generate on the fly when requested. We can store a generated PDF in S3 or on disk if persistent access is needed, but on-the-fly generation is fine for low volume.
   * On the frontend, show a “Download Certificate” button on the results page if passed. That triggers the above API.
   * Test by actually generating a PDF and perhaps verifying its content (we might parse text from it to ensure the name is correct, or just manually inspect).
   * Document in user docs how to get their certificate.

5. **Webcam Proctoring:** This is a complex feature; likely use third-party integration or simple snapshots:

   * We can use the browser Media APIs to capture a photo from the user’s webcam at intervals during the exam. E.g., every minute, take a snapshot (canvas image) and send to backend. The backend could simply store these images (in S3 or filesystem) associated with the submission. Admin can review them to ensure the same person was taking the test and no unauthorized person was present.
   * Privacy implications are high; we’d need user consent (so we’ll have a checkbox “I allow webcam monitoring” before exam). We also need to ensure the data is handled securely.
   * Implementation: front-end uses `navigator.mediaDevices.getUserMedia`. We can show the live video to the user (small preview) to alleviate privacy concerns somewhat. Then capture frames using canvas.
   * Back-end: an endpoint like `POST /api/exams/{id}/snap` to accept an image (maybe base64 or binary) and store it. Or integrate with a cloud service for face recognition (probably too advanced for our scope).
   * Because this feature could be very time-consuming, it might be last in priority. We’ll design it in detail after other features are done, or consider using a service if any.
   * Testing: we can do manual testing for this (automated testing of webcam might be limited, though Playwright can simulate a camera input).
   * Documentation: add a section for proctoring explaining how it works and data retention policy.

Each of these features will be developed in sequence, not all at once, to keep the system stable. After each addition, we will bump the version (v1.1, v1.2, etc.), run all tests, update docs, and deploy via CI/CD. We will also gather user feedback after launch to maybe adjust priorities (for example, if users urgently need certificates, we do that before calendar integration, etc.).

Throughout this process, **documentation remains up-to-date**: every new feature has its own markdown doc or an update to existing docs. We might also start a **changelog.md** to record changes per version after launch.

Finally, as a general practice, we will hold brief post-launch retrospectives to ensure the quality of the implementation. This includes reviewing test coverage reports, any production issues that occurred, and improving our codebase structure if needed (for example, if some code becomes monolithic, consider refactoring into modules or even microservices if absolutely needed down the line).