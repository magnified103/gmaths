# GMATHS Platform — Technology Stack (May 2025)

## Frontend (Client)
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | **React** | 19.1 |
| Compiler / Language | **TypeScript** | 5.8 |
| Build Tool | **Vite** | 6.3.5 |
| Styling | **Tailwind CSS** | 4.1.7 |
| State / Data Fetch | **TanStack Query** | 5.5 |
| UI Primitives | **Headless UI** | 1.1 |
| Math Rendering | **MathJax** | 4.0 |
| Package Manager | **pnpm** | 10.11 |

## Backend (Server)
| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | **Node.js** (LTS “Iron”) | 22.x |
| Web Framework | **Fastify** | 5.3.x |
| Language | **TypeScript** | 5.8 |
| ORM / Migrations | **Prisma** | 6.8.2 |
| Auth Tokens | **jsonwebtoken** | 10.x |
| Password Hashing | **bcrypt** | 6.x |
| Input Validation | **Zod** | 3.x |
| Security Headers | **Helmet** | 7.x |
| Logging | **Pino** | 9.x |
| Job Queue | **BullMQ** | 5.x (Redis-backed) |

## Data Stores
| Purpose | Technology | Version |
|---------|------------|---------|
| Primary Relational DB | **PostgreSQL** | 17.5 |
| Cache / Sessions / Queue Broker | **Redis** | 7.2.x |

## Testing & QA
| Scope | Technology | Version |
|-------|------------|---------|
| Unit / Integration | **Vitest** | 3.1.4 |
| E2E Browser Tests | **Playwright** | 1.52.0 |
| Linting | **ESLint** | 9.x (`@typescript-eslint` 8.x) |
| Formatting | **Prettier** | 3.x |

## DevOps & Tooling
| Area | Technology | Version |
|------|------------|---------|
| Containerization | **Docker Engine** | 26.x |
| Local Orchestration | **docker-compose** | 2.27.x |
| Process Manager | **PM2** | 6.x |
| CI/CD | **GitHub Actions** | Node 22 runner |
| Email Delivery | **AWS SES SDK** | v4 |
| Static Asset Delivery | **AWS CloudFront** | (current) |