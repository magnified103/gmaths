# GMATHS Platform — Technology Stack (2025)

## Frontend (Client)
| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | **React** | 18.x | Latest Stable (React 19 is recent) |
| Compiler / Language | **TypeScript** | 5.x | Latest Stable |
| Build Tool | **Vite** | 6.x | Latest Stable |
| Styling | **Tailwind CSS** | 4.x | Latest Stable |
| State / Data Fetch | **TanStack Query** | 5.x | Latest Stable |
| UI Primitives | **Headless UI** | 2.x | Latest Stable |
| Math Input Editor | **MathLive** | 0.9x | For `<math-field>` input, as per PRD |
| Math Rendering | **MathJax** | 4.x | For rendering static LaTeX |
| WebSocket Client | **Socket.io Client** | 4.x | Aligns with Socket.io server v4 |
| Package Manager | **npm** | 10.x | Bundled with Node.js LTS |

## Backend (Server)
| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Runtime | **Node.js** | 20.x | Latest LTS ("Iron") |
| Web Framework | **Fastify** | 4.x | Latest Stable |
| Language | **TypeScript** | 5.x | Latest Stable |
| ORM / Migrations | **Prisma** | 5.x | Latest Stable |
| Auth Tokens | **jsonwebtoken** | 9.x | Latest Stable |
| Password Hashing | **bcrypt** | 5.x | Latest Stable |
| Input Validation | **Zod** | 3.x | Latest Stable |
| CSV Parsing | **csv-parse** | 5.x | For CSV import/export features |
| Security Headers | **@fastify/helmet** | 10.x | Compatible with Fastify 4.x |
| Logging | **Pino** (built into Fastify) | 9.x | Latest Stable |
| WebSocket Server | **Socket.io** | 4.x | Main WebSocket framework, server-side |
| HTTP Cookie Handling | **@fastify/cookie** | 9.x | Compatible with Fastify 4.x |

## Data Stores
| Purpose | Technology | Version | Notes |
|---------|------------|---------|-------|
| Primary Relational DB | **PostgreSQL** | 16.x | Latest Stable Major Version |
| Cache / Refresh Tokens / WebSocket PubSub | **Redis** | 7.2.x | Latest Stable |

## Real-time & Performance
| Purpose | Technology | Version | Notes |
|---------|------------|---------|-------|
| WebSocket Framework | **Socket.io** | 4.x | Core real-time communication |
| Redis Adapter (Socket.io) | **@socket.io/redis-adapter** | 8.x | For scaling WebSockets with Redis |
| Job Queue | **BullMQ** | 5.x | For background tasks (e.g., CSV processing) |
| Process Manager | **PM2** | 5.x | For Node.js application management |

## Testing & QA
| Scope | Technology | Version | Notes |
|-------|------------|---------|-------|
| Unit / Integration | **Vitest** | 1.x | Latest Stable |
| E2E Browser Tests | **Playwright** | 1.x | Latest Stable |
| Linting | **ESLint** | 9.x (`@typescript-eslint` 8.x) | Latest Stable |
| Formatting | **Prettier** | 3.x | Latest Stable |

## DevOps & Infrastructure
| Area | Technology | Version | Notes |
|------|------------|---------|-------|
| Containerization | **Docker Engine** | 27.x | Latest Stable |
| Local Orchestration | **docker-compose** | 2.x | Latest Stable |
| Reverse Proxy | **Nginx** | 1.26.x | Latest Stable |
| CI/CD | **GitHub Actions** | Node 22 runner | Or Node 20 for consistency |
| Email Delivery | **AWS SES SDK** | v3 | Latest SDK version |
| Static Asset Delivery | **Nginx** (initially) | - | CDN like CloudFront for future scaling |

## Development Tools
| Purpose | Technology | Version | Notes |
|---------|------------|---------|-------|
| Package Management | **npm workspaces** | 10.x | Via Node.js LTS |
| Environment Management | **dotenv** | 16.x | Latest Stable |
| API Documentation | **OpenAPI/Swagger** | 3.x | Standard for API design |
| Database GUI | **Prisma Studio** | (latest) | Bundled with Prisma |

## AI/ML (Optional - Phase 4)
| Purpose | Potential Technology | Notes |
|---------|------------------------|-------|
| Webcam Proctoring | **TensorFlow.js** or **OpenCV.js** | For client-side basic AI checks (face-count, movement) |
| Webcam Proctoring (Advanced) | Cloud AI Service (e.g., **AWS Rekognition**) | For more robust server-side analysis if needed |