# GMATHS Platform — Technology Stack (2025)

## Frontend (Client)
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | **React** | 19.x |
| Compiler / Language | **TypeScript** | 5.x |
| Build Tool | **Vite** | 6.x |
| Styling | **Tailwind CSS** | 4.x |
| State / Data Fetch | **TanStack Query** | 5.x |
| UI Primitives | **Headless UI** | 2.x |
| Math Rendering | **MathJax** | 4.x |
| WebSocket Client | **Socket.io Client** | 4.x |
| Package Manager | **npm** | 10.x |

## Backend (Server)
| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | **Node.js** (LTS "Jod") | 22.x |
| Web Framework | **Fastify** | 5.x |
| Language | **TypeScript** | 5.x |
| ORM / Migrations | **Prisma** | 6.x |
| Auth Tokens | **jsonwebtoken** | 9.x |
| Password Hashing | **bcrypt** | 5.x |
| Input Validation | **Zod** | 3.x |
| Security Headers | **@fastify/helmet** | 12.x |
| Logging | **Pino** (built into Fastify) | 9.x |
| WebSocket Server | **@fastify/websocket** | 11.x |
| Session Management | **@fastify/cookie** | 10.x |

## Data Stores
| Purpose | Technology | Version |
|---------|------------|---------|
| Primary Relational DB | **PostgreSQL** | 17.x |
| Cache / Sessions / WebSocket PubSub | **Redis** | 7.2.x |

## Real-time & Performance
| Purpose | Technology | Version |
|---------|------------|---------|
| WebSocket Framework | **Socket.io** | 4.x |
| Redis Adapter | **@socket.io/redis-adapter** | 8.x |
| Job Queue | **BullMQ** | 5.x |
| Process Manager | **PM2** | 6.x |

## Testing & QA
| Scope | Technology | Version |
|-------|------------|---------|
| Unit / Integration | **Vitest** | 3.x |
| E2E Browser Tests | **Playwright** | 1.x |
| Linting | **ESLint** | 9.x (`@typescript-eslint` 8.x) |
| Formatting | **Prettier** | 3.x |

## DevOps & Infrastructure
| Area | Technology | Version |
|------|------------|---------|
| Containerization | **Docker Engine** | 27.x |
| Local Orchestration | **docker-compose** | 2.x |
| Reverse Proxy | **Nginx** | 1.26.x |
| CI/CD | **GitHub Actions** | Node 22 runner |
| Email Delivery | **AWS SES SDK** | v3 |
| Static Asset Delivery | **Nginx** | (direct serving) |

## Development Tools
| Purpose | Technology | Version |
|---------|------------|---------|
| Package Management | **npm workspaces** | 10.x |
| Environment Management | **dotenv** | 16.x |
| API Documentation | **OpenAPI/Swagger** | 3.x |
| Database GUI | **Prisma Studio** | (latest) |