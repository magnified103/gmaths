# GMATHS Platform Code Style Guide

## Overview
This style guide defines the coding standards for the GMATHS online testing platform. It draws from Google’s official TypeScript style guide and includes project-specific conventions for our TypeScript monorepo (which includes a React frontend with Vite, a Fastify backend, and Prisma for the database). The guidelines cover formatting, naming, file structure, documentation, and testing. **All rules below are mandatory** – the LLM agent (and any human developer) should follow them strictly and flag any deviations to maintain consistency and clarity.

## Formatting & General Conventions
- **Indentation:** Use 2 spaces per indentation level. Never use tabs.
- **Braces:** Always use curly braces for control structures (`if`, `for`, `while`, etc.), even for single-line blocks. Place the opening brace on the same line as the statement (e.g. `if (condition) {`) and the closing brace on a new line. This consistent brace style improves readability and prevents errors.
- **Semicolons:** Always end statements with a semicolon (`;`). Do not rely on JavaScript's automatic semicolon insertion.
- **Quotes:** Use single quotes for string literals (`'example'`). Use template literals (backticks `` `like this` ``) for strings that span multiple lines or include embedded expressions. Avoid using double quotes except when a string contains many single quote characters that would require escaping.
- **Line Length:** Aim to keep lines at or below 80 characters (100 characters maximum). If a line is getting too long, break it into multiple lines for better readability.
- **Whitespace:** Do not leave trailing whitespace at the end of lines. Use one blank line to separate logical sections of code, but avoid multiple consecutive blank lines. For example, leave a blank line between import statements and the next piece of code, or between function definitions.
- **Trailing Commas:** In multiline object literals, arrays, or function parameter lists, include a trailing comma after the last item. This makes diffs cleaner and reduces the chance of syntax errors when new items are added.
- **Type Annotations:** Leverage TypeScript’s type inference, but explicitly annotate function return types and complex object types for clarity. Avoid using the `any` type unless absolutely necessary. Prefer more specific types or `unknown`. If `any` must be used (e.g. a third-party library type), consider adding a comment explaining why.
- **Strict Mode:** Always enable and comply with TypeScript's strict type-checking options. Address compiler warnings by refining the code or types rather than suppressing them.
- **Equality:** Use strict equality operators (`===` and `!==`) instead of `==` or `!=` to avoid type-coercion issues.
- **Arrow Functions:** Use arrow functions for inline callbacks and functional expressions when appropriate. Keep arrow function bodies concise; omit the `{}` and `return` for single-expression functions. If the function is more complex (multiple statements), use a block body with braces for clarity.

## Naming Conventions
We follow Google’s TypeScript naming conventions to keep names consistent and meaningful:
- **Variables and Functions:** Use `lowerCamelCase` for variable names, function names, object properties, and method names. For example: `let maxScore = 0;` or `function calculateGrade() { ... }`. Function names should generally be descriptive verbs or verb phrases (e.g., `sendEmail`, `getUserById`) that indicate the function’s action.
- **Classes, Interfaces, Types, Enums:** Use `UpperCamelCase` (PascalCase) for class names, interface names, type aliases, enum names, and React component names. Examples: `class ExamService { ... }`, `interface UserAccount { ... }`, `enum QuestionType { MultipleChoice, Essay }`, and a React component function `function LoginPage() { ... }`.
- **Constants:** Use `CONSTANT_CASE` (all uppercase letters with underscores) for constant values that never change after initialization. This includes truly constant variables (e.g., configuration values) and enum members. Example: `const MAX_RETRY_COUNT = 5;` and `enum Status { SUCCESS, FAILURE }` (here `SUCCESS` and `FAILURE` are constant enum values).
- **Descriptive Names:** Choose clear and descriptive names. Avoid abbreviations or acronyms that are not universally understood. For instance, prefer `totalScore` over `totScr` and `databaseId` over `dbId` (unless “DB” is a well-understood context in the project). Single-letter names (like `i`, `j` for loops) are acceptable only in very short scopes. Every name should communicate intent.
- **Interface Naming:** Do not prefix interface names with `I`. Name interfaces like any other type, using PascalCase (e.g., use `User` instead of `IUser` for an interface representing a user).
- **Acronyms:** Treat acronyms as regular words in naming. For example, write `HttpRequest` instead of `HTTPRequest` (capitalize only the H in PascalCase), and `endpointUrl` instead of `endpointURL`. In camelCase, acronyms should appear in lower case (e.g., `urlString` not `URLString`).
- **File Names:** File names should be all lowercase. If a file name contains multiple words, separate them with a hyphen or underscore (choose one style and use it consistently). For example, `user-controller.ts` or `user_controller.ts`. React component files may use PascalCase to match the component name (e.g., `LoginPage.tsx` contains the `LoginPage` component).
- **Directory Names:** Use lowercase for directory names. Use plural nouns for directories that contain collections of items (e.g., `components`, `routes`, `services`). This aligns with the structure defined in the implementation plan.
- **Avoid Unnecessary Prefixes/Suffixes:** Don’t use prefixes like `mgr` or `util` in names—let the name itself describe the entity. Suffixes like `Factory` or `Impl` should be used only when they add meaningful differentiation. Do not use a trailing underscore `_` in names (even for private properties; instead, rely on `private` visibility and clear naming).

## Project Structure and Organization
We enforce a strict monorepo structure for this project. Every file and folder must be in its designated place. The LLM agent must follow this structure exactly and should flag any files or directories that are mislocated. The expected project structure is:

```text
gmaths-education-website/
├── backend/               # Fastify backend (Node.js/TypeScript)
│   ├── package.json       # Backend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for backend
│   ├── src/               # Source code for the Fastify server
│   │   ├── routes/        # Route handlers (e.g., auth routes, exam routes)
│   │   ├── plugins/       # Fastify plugins (e.g., authentication, Prisma integration)
│   │   ├── services/      # Business logic (e.g., grading service, user management)
│   │   ├── models/        # Data models / ORM layer (Prisma schema in ../prisma/)
│   │   └── utils/         # Utility modules (helpers, validators, etc.)
│   ├── prisma/            # Prisma schema and migration files
│   │   └── schema.prisma  # Prisma data model definitions (User, Exam, Question, etc.)
│   ├── tests/             # Backend tests (unit and integration tests run with Vitest)
│   └── .env               # Environment variables for backend (DB connection, secrets, etc.)
├── frontend/              # React frontend (Vite + TypeScript)
│   ├── package.json       # Frontend dependencies and scripts
│   ├── tsconfig.json      # TypeScript config for frontend
│   ├── vite.config.ts     # Vite configuration (including test settings)
│   ├── src/               # Frontend source code
│   │   ├── components/    # Reusable UI components (buttons, form inputs, etc.)
│   │   ├── pages/         # Page components (views like Login, ExamList, TakeExam, Results, Admin)
│   │   ├── api/           # API interaction layer (functions for HTTP requests to backend)
│   │   └── App.tsx        # Application root component
│   ├── tests/             # Frontend tests (unit tests using Vitest + Testing Library)
│   └── public/            # Static assets (icons, images, etc.)
├── e2e/
│   └── tests/             # End-to-end tests (Playwright) simulating user flows
├── docs/                  # Documentation (Markdown files)
│   ├── README.md          # Overview and project introduction
│   ├── architecture.md    # Architecture decisions and diagrams
│   ├── auth.md            # Documentation for authentication features
│   ├── exams.md           # Documentation for exams feature (API details, data models)
│   └── ...                # Additional docs for other features or references
├── package.json           # Root package config (scripts to run tests, lint, etc. across workspaces)
└── .github/
    └── workflows/ci-cd.yml  # CI/CD pipeline definition
````

Every new file must be placed in the appropriate location as per the structure above. For example, if you add a new API route for courses, it should go under `backend/src/routes/` (and possibly a corresponding service under `backend/src/services/`). A new React component for a leaderboard should go under `frontend/src/components/` or `frontend/src/pages/` depending on its use. **Do not create new top-level directories** or arbitrarily nested folders that differ from the plan. If a structural change is needed, update the implementation plan and this guide accordingly. The agent should treat any deviation from this established structure as an error.

## Documentation & Comments

Clear documentation is crucial for maintainability and for the LLM agent to understand the code. We require JSDoc comments on significant functions and encourage explanatory comments for complex logic:

* **JSDoc for Functions:** All non-trivial functions and methods **must** include a JSDoc comment above their definition. A "non-trivial" function is any function that contains more than a few lines of logic or does something not obvious from its name. (As a rule of thumb, if it's more than a simple one-liner or its purpose isn’t immediately clear, add documentation.) The JSDoc should describe what the function does, explain any important details about how it works, and document its inputs/outputs.

  * **Description:** Begin the comment with a brief description of the function’s purpose. This should be a succinct phrase or sentence in **imperative mood** (for example, "Compute the final grade percentage for a student...").
  * **@param:** For each parameter, use an `@param` tag with the parameter name and a description of its role. Do **not** include the type in the description (the TypeScript type already documents that). Instead, mention what the parameter represents or any expectations (e.g., units, formats, valid ranges). If a function has no parameters, you can omit this section.
  * **@returns:** If the function returns a value, use an `@returns` (or `@return`) tag to describe what is returned. Again, focus on the meaning of the return value, especially if it's not obvious. If the function returns a special value in certain cases (like `null` or `-1`), document that as well. For `void` functions (no return value), this tag can be omitted.
  * *Example:*

    ```ts
    /**
     * Calculates a student's overall grade percentage.
     * @param scores - An array of scores for each completed exam or assignment.
     * @returns The final grade as a percentage (0 to 100). Returns null if no scores are provided.
     */
    function calculateGrade(scores: number[]): number | null {
      if (scores.length === 0) {
        return null;
      }
      // ...calculate average and return it...
    }
    ```
  * For classes and interfaces, provide a JSDoc comment above the class or interface definition if its purpose is not obvious. Describe what the class or interface represents.
  * *Avoid redundancy:* Do not write comments that simply restate the function name or TypeScript types. For example, avoid saying `@param id - The id of the user` when the parameter is already `id: string`. Instead, provide additional context: `@param id - The unique user ID (UUID) of the user to retrieve`.
* **Inline Comments:** Use inline comments (`// ...`) to clarify complex or non-obvious code logic. Place them above the line or block of code they explain. Good inline comments explain the intent behind code or any tricky aspects, not obvious things. For example:

  ```ts
  // Use binary search for efficiency, since `items` is sorted.
  const index = findIndex(items, target);
  ```

  Avoid comments that state the obvious or simply translate code into words. The goal is to help a reader (or the AI) understand *why* the code is doing something if it's not immediately clear.
* **Comment Style:** Write comments in clear, concise English. When writing multi-line explanatory comments (not JSDoc), it's generally preferred to use `//` at the start of each line of the comment block (this makes it easy to add or remove comment markers and is clearer in diffs). Reserve `/* ... */` block comments for disabling blocks of code or for JSDoc. Always update or remove comments that become outdated or incorrect.
* **TODO and FIXME:** Use `// TODO:` to mark areas of the code that need further work or improvements, and `// FIXME:` to mark known issues that should be fixed. Include a brief note after each TODO or FIXME explaining what is needed. For example: `// TODO: handle the case where the user is not found`. These comments should be addressed in a timely manner; they serve as markers for incomplete tasks or technical debt.
* **Function Design and Return Statements:** Write functions to be as straightforward as possible. We encourage using multiple return statements to keep code simple:

  * Use **early returns** to handle error cases or trivial cases at the start of a function. This prevents deep nesting and makes the code easier to follow. For example:

    ```ts
    function getStudentGrade(studentId: string): number | null {
      if (!studentId) {
        return null; // Guard clause: no studentId provided
      }
      // ...fetch student and calculate grade...
    }
    ```

    In the above case, returning early for a bad input (`studentId` not provided) avoids wrapping the rest of the function in an `if` block. **Multiple return statements are allowed and encouraged** when they make the logic clearer. The outdated practice of having a single return at the end of a function does not apply here.
  * If a function performs a sequence of checks (e.g., validating inputs or checking user permissions), handle those with guard clauses that return or throw errors as soon as a condition fails. This way, the “happy path” of the function is not nested inside multiple layers of `if`.
  * **Side effects:** If a function modifies state outside its scope (for example, updates a database record, writes to a file, or modifies a global variable), document this behavior in the function’s comments or JSDoc. Functions with significant side effects should have names that hint at it (e.g., `saveUserData` or `sendEmailNotification`), and their effects should be explained so callers know what to expect. The agent should be careful to avoid introducing unintended side effects; every side effect should be intentional and documented.

## Testing Conventions

Our project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end tests. The code style and organization of tests are just as important as the application code. We follow common testing best practices regarding structure, naming, and scope of tests.

### Unit and Integration Tests (Vitest)

* **Location & Structure:** Test files for the backend go in `backend/tests/` and for the frontend in `frontend/tests/`. Within those directories, organize tests to mirror the source structure. For example, if `backend/src/services/authService.ts` exists, its tests might live in `backend/tests/services/authService.test.ts`. If `frontend/src/pages/ExamList.tsx` is a page component, put its tests in `frontend/tests/pages/ExamList.test.tsx`. This parallel structure makes it easy to find tests corresponding to a given module.
* **File Naming:** Name test files after the module or component they test, with a `.test.ts` or `.test.tsx` suffix. For example: `mathUtils.test.ts` for tests of `mathUtils.ts`, or `LoginPage.test.tsx` for tests of the `LoginPage.tsx` component. (Vitest will recognize files with `.test.` or `.spec.` in the filename. We prefer using `.test.` for clarity, but consistency is the key—use the same convention throughout the project.)
* **Test Granularity:** Each test file should focus on a single unit or a small logical grouping. Within a test file, use one top-level `describe` block for the subject under test (e.g., a function or component name), and inside it write individual `it`/`test` cases for each expected behavior. Write tests that are focused on one aspect each. It's better to have multiple small, focused tests than one large test that attempts to cover everything.
* **Testing Implementation:** Use the Arrange-Act-Assert pattern in tests:

  1. *Arrange:* set up the inputs and environment for the test (e.g., initialize objects, set up test data, stub or mock dependencies).
  2. *Act:* execute the code under test (e.g., call the function or render the component).
  3. *Assert:* verify the result or side effects (e.g., check that the return value is correct, or that the component rendered expected output, or that a mock was called as expected).

  Keeping this structure in mind makes tests easier to read and ensures you're testing one thing at a time. Avoid logic in test code itself; the test should be straightforward to follow.
* **Integration Tests:** In addition to unit tests for individual functions or components, some tests may exercise the interaction between components or the integration of modules (e.g., testing an API endpoint through the Fastify server and hitting the database). These are integration tests, and they can also be run via Vitest. Structure integration tests clearly:

  * You might place them in a separate directory like `backend/tests/integration/` or name the files distinctively (e.g., `*.integration.test.ts`) to differentiate from pure unit tests.
  * Integration tests often require more setup (starting a test database, seeding data, running the Fastify server on a test port, etc.). Use Vitest’s setup hooks (`beforeAll`, `afterAll`, etc.) for this initialization and teardown.
  * Keep integration tests as isolated as possible—e.g., use a test database or transaction rollbacks so that one test’s data doesn’t affect another.
* **Frontend Component Tests:** For React components (frontend), use @testing-library/react with Vitest. Test the component’s external behavior and rendered output, not its internal implementation details. For example, simulate user interactions (clicks, typing) and assert on changes in the DOM or component outputs. Ensure the component is tested in isolation by mocking context providers or external services if needed. Name these tests similarly (matching the component name with a `.test.tsx` file) and place them in the corresponding `frontend/tests` subdirectory.

### End-to-End Tests (Playwright)

* **Location:** End-to-end tests reside in the top-level `e2e/tests/` directory. These tests run the full application (usually a test instance of the backend and frontend) and simulate user actions via a browser.
* **File Naming:** Use descriptive names for Playwright test files, ending in `.spec.ts`. For example, `login.spec.ts` for testing the login workflow, or `exam-flow.spec.ts` for testing an end-to-end exam taking process. The name should make it clear which user journey or feature is under test.
* **Test Content:** Within an E2E test file, use `test.describe()` blocks to group related tests (e.g., all tests under `describe('Exam Taking Flow', ...)`), and individual `test()` cases for each scenario. Each `test` case should simulate a complete user scenario from start to finish. For instance, one test might cover "student logs in, takes an exam, and sees the results".
* **Best Practices:** Follow Playwright and general E2E best practices:

  * Always await Playwright actions and navigations (e.g., `await page.click('text=Login')`). Use Playwright’s built-in waiting mechanisms rather than arbitrary delays to ensure tests are stable.
  * Use `beforeEach`/`afterEach` or `beforeAll`/`afterAll` hooks in Playwright test files to handle repetitive setup, such as launching the browser, navigating to the base URL, or seeding necessary data via APIs. For example, you might use `beforeEach` to log in a user if every test in a describe block requires an authenticated session.
  * Keep tests independent of each other. Reset state between tests so that one test's outcome does not affect the next. This may involve cleaning up created records or using separate user accounts for each test.
* **Fixtures & Config:** Define reusable setup in Playwright fixtures or the global configuration. For example, if many tests require a certain state (like a user existing in the database), consider writing a helper function or using Playwright’s fixtures to set that up. Manage configuration (like base URLs, timeouts, browser options, etc.) in `playwright.config.ts` at the root. This config should follow Playwright’s recommended structure and be checked into version control.
* **Test Isolation:** Each Playwright test should be able to run on its own. Avoid scenarios where one test depends on another having run first. You can enforce test order independence by writing and running tests in a way that doesn’t rely on shared state. For example, use unique test data for each test (unique usernames, etc.) or reset the database between tests (perhaps by running migrations/seed in a fresh test environment).
* **Granularity:** Don’t try to test too many things in one E2E test. It’s better to have multiple smaller test cases that each verify one aspect of a feature (e.g., one test for a successful form submission, another test for validation errors, another for a navigation flow) than one monolithic test that goes through numerous steps and assertions. This makes it easier to pinpoint failures and maintain tests. Use meaningful test titles that clearly state what scenario is being tested and the expected outcome.