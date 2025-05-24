# GMATHS Platform Code Style Guide

## Overview
This style guide defines the coding standards for the GMATHS online testing platform. It draws from Google's official TypeScript style guide and includes project-specific conventions for our TypeScript monorepo with React frontend (Vite), Fastify backend, Prisma ORM, and Socket.io for real-time features. The guidelines cover formatting, naming, file structure, documentation, and testing. **All rules below are mandatory** for maintaining consistency and clarity.

## Formatting & General Conventions
- **Indentation:** Use 2 spaces per indentation level. Never use tabs.
- **Braces:** Always use curly braces for control structures (`if`, `for`, `while`, etc.), even for single-line blocks. Place the opening brace on the same line as the statement and the closing brace on a new line.
- **Semicolons:** Always end statements with a semicolon (`;`). Do not rely on JavaScript's automatic semicolon insertion.
- **Quotes:** Use single quotes for string literals (`'example'`). Use template literals (backticks) for strings with embedded expressions or multiple lines. Avoid double quotes except when a string contains many single quotes.
- **Line Length:** Aim to keep lines at or below 80 characters (100 characters maximum). Break long lines for better readability.
- **Whitespace:** Do not leave trailing whitespace. Use one blank line to separate logical sections of code. Avoid multiple consecutive blank lines.
- **Trailing Commas:** Include trailing commas in multiline object literals, arrays, and function parameter lists for cleaner diffs.
- **Type Annotations:** Leverage TypeScript's type inference, but explicitly annotate function return types and complex object types. Avoid using `any` type unless absolutely necessary.
- **Strict Mode:** Always enable and comply with TypeScript's strict type-checking options.
- **Equality:** Use strict equality operators (`===` and `!==`) instead of `==` or `!=`.
- **Arrow Functions:** Use arrow functions for inline callbacks and functional expressions. Omit braces for single-expression functions.

## Naming Conventions
We follow Google's TypeScript naming conventions for consistency:
- **Variables and Functions:** Use `lowerCamelCase` for variable names, function names, object properties, and method names. Function names should be descriptive verbs indicating the function's action.
- **Classes, Interfaces, Types, Enums:** Use `UpperCamelCase` (PascalCase) for class names, interface names, type aliases, enum names, and React component names.
- **Constants:** Use `CONSTANT_CASE` (all uppercase with underscores) for constant values that never change after initialization.
- **Descriptive Names:** Choose clear and descriptive names. Avoid abbreviations or acronyms unless universally understood. Every name should communicate intent.
- **Interface Naming:** Do not prefix interface names with `I`. Name interfaces using PascalCase (e.g., use `User` instead of `IUser`).
- **Acronyms:** Treat acronyms as regular words in naming. In PascalCase, capitalize only the first letter of acronyms.
- **File Names:** Use lowercase file names. For multiple words, use kebab-case (hyphen-separated). React component files may use PascalCase to match the component name.
- **Directory Names:** Use lowercase for directory names. Use plural nouns for directories containing collections of items.
- **Avoid Unnecessary Prefixes/Suffixes:** Don't use prefixes like `mgr` or `util`. Suffixes like `Factory` should only be used when they add meaningful differentiation.

## Project Structure and Organization
Strict monorepo structure enforced from day one:

```text
gmaths-education-website/
├── backend/               # Fastify backend (Node.js/TypeScript)
│   ├── package.json       # Backend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for backend
│   ├── src/               # Source code for the Fastify server
│   │   ├── routes/        # Route handlers (auth, exams, websocket)
│   │   ├── plugins/       # Fastify plugins (auth, Prisma, websocket)
│   │   ├── services/      # Business logic (auth, grading, timer sync)
│   │   ├── models/        # Data models and interfaces
│   │   ├── utils/         # Utility modules (validators, helpers)
│   │   └── websocket/     # WebSocket handlers and Redis pub/sub
│   ├── prisma/            # Prisma schema and migration files
│   │   └── schema.prisma  # Data model definitions
│   ├── tests/             # Backend tests (unit and integration)
│   └── .env               # Environment variables
├── frontend/              # React frontend (Vite + TypeScript)
│   ├── package.json       # Frontend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for frontend
│   ├── vite.config.ts     # Vite configuration
│   ├── src/               # Frontend source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Vietnamese UI)
│   │   ├── api/           # API interaction layer
│   │   ├── websocket/     # WebSocket client and timer sync
│   │   ├── types/         # Shared TypeScript interfaces
│   │   └── App.tsx        # Application root component
│   ├── tests/             # Frontend tests (unit tests)
│   └── public/            # Static assets
├── e2e/
│   └── tests/             # End-to-end tests (Playwright)
├── docs/                  # Documentation (Markdown files)
│   ├── README.md          # Project overview
│   ├── architecture.md    # Architecture decisions
│   ├── auth.md            # Authentication documentation
│   ├── exams.md           # Exam system documentation
│   ├── websocket.md       # Real-time features documentation
│   └── deployment.md      # AWS deployment guide
├── package.json           # Root workspace config
└── .github/
    └── workflows/ci-cd.yml  # CI/CD pipeline definition
```

Every new file must be placed in the appropriate location. Do not create new top-level directories or arbitrarily nested folders that differ from this structure.

## Documentation & Comments

Clear documentation is crucial for maintainability and for future development sessions. JSDoc comments are required on significant functions:

**JSDoc for Functions:** All non-trivial functions and methods must include a JSDoc comment above their definition. The JSDoc should describe what the function does and document its inputs/outputs.

- **Description:** Begin with a brief description of the function's purpose in imperative mood.
- **@param:** For each parameter, use an `@param` tag with the parameter name and description. Focus on the meaning of the parameter, not just restating the type.
- **@returns:** If the function returns a value, use `@returns` to describe what is returned.

Example:
```ts
/**
 * Calculates a student's overall grade percentage based on exam scores.
 * @param scores - Array of numerical scores for completed exams.
 * @returns The final grade as a percentage (0 to 100). Returns null if no scores provided.
 */
function calculateGrade(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  // Calculate and return average
}
```

**Inline Comments:** Use inline comments (`// ...`) to clarify complex or non-obvious code logic. Place them above the line or block they explain. Good inline comments explain the intent behind code, not obvious operations.

**Comment Style:** Write comments in clear, concise English. Use `//` for single-line comments and `/* ... */` for JSDoc. Always update or remove outdated comments.

**TODO and FIXME:** Use `// TODO:` for areas needing further work and `// FIXME:` for known issues. Include a brief note explaining what is needed.

**Function Design:** Write functions to be straightforward. Use early returns to handle error cases at the start of functions, preventing deep nesting.

**Side Effects:** If a function modifies state outside its scope, document this behavior in the function's comments. Functions with side effects should have names that hint at it.

## Testing Conventions

Testing is crucial for the platform's reliability. We use **Vitest** for unit and integration tests, and **Playwright** for end-to-end tests.

### Unit and Integration Tests (Vitest)

**Location & Structure:** Test files for the backend go in `backend/tests/` and for the frontend in `frontend/tests/`. Organize tests to mirror the source structure. For example, tests for `backend/src/services/authService.ts` go in `backend/tests/services/authService.test.ts`.

**File Naming:** Name test files after the module they test, with a `.test.ts` or `.test.tsx` suffix. Use `.test.` consistently throughout the project.

**Test Granularity:** Each test file should focus on a single unit or small logical grouping. Use one top-level `describe` block for the subject under test, with individual `it`/`test` cases for each expected behavior.

**Testing Implementation:** Use the Arrange-Act-Assert pattern:
1. **Arrange:** Set up inputs and environment for the test
2. **Act:** Execute the code under test  
3. **Assert:** Verify the result or side effects

**Integration Tests:** Test the interaction between components or modules. Structure integration tests clearly, possibly in separate directories like `backend/tests/integration/`.

**Frontend Component Tests:** For React components, use @testing-library/react with Vitest. Test the component's external behavior and rendered output, not internal implementation details.

### End-to-End Tests (Playwright)

**Location:** End-to-end tests reside in `e2e/tests/`. These tests run the full application and simulate user actions via a browser.

**File Naming:** Use descriptive names ending in `.spec.ts`. For example, `login.spec.ts` for testing login workflow, or `exam-flow.spec.ts` for testing exam taking process.

**Test Content:** Use `test.describe()` blocks to group related tests and individual `test()` cases for each scenario. Each test case should simulate a complete user scenario from start to finish.

**Best Practices:**
- Always await Playwright actions and navigations
- Use Playwright's built-in waiting mechanisms rather than arbitrary delays
- Use `beforeEach`/`afterEach` hooks for repetitive setup
- Keep tests independent of each other by resetting state between tests

**Test Isolation:** Each Playwright test should be able to run on its own. Avoid scenarios where one test depends on another having run first.

**Granularity:** Don't try to test too many things in one E2E test. Multiple smaller test cases are better than one monolithic test.

## Platform-Specific Conventions

### Vietnamese UI Text
- All user-facing text in components should be in Vietnamese
- Use proper Vietnamese diacritics and formatting
- Keep technical terms in English within Vietnamese sentences where appropriate
- Example: `"Đăng nhập"` for "Login", `"Mật khẩu"` for "Password"

### Question Type Interfaces
Follow the extensible question type system:
```typescript
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
```

### WebSocket Event Naming
Use descriptive, action-based event names:
- `timer:sync` for timer synchronization
- `exam:submit` for exam submission
- `session:reconnect` for session reconnection

### API Route Structure
Follow RESTful conventions with clear resource naming:
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id/take` - Get exam for taking
- `POST /api/exams/:id/submit` - Submit exam answers

### Error Handling
Use consistent error response format:
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
```

### Environment Variables
Use descriptive, uppercase names with underscores:
- `DATABASE_URL` for database connection
- `JWT_SECRET` for JWT signing key
- `REDIS_URL` for Redis connection

This style guide ensures consistency across all development sessions and maintains high code quality throughout the project lifecycle.