# WorkSphere — Enterprise Employee Service Desk & Task Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-336791.svg)](https://www.postgresql.org/)
[![CI Status](https://img.shields.io/badge/CI-GitHub_Actions-emerald.svg)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)]()

> **WorkSphere** is a centralized internal operations SaaS platform engineered for enterprise employee service desks and team task management. Developed as a portfolio and internship capstone project for the **Arrowstack Full Stack Development Internship**.

---

## 1. Project Overview & Two Core Modules

WorkSphere solves fragmented workplace communication by combining **two distinct, fully realized functional requirements** within a unified enterprise application:

```
+-----------------------------------------------------------------------------------+
|                                    WorkSphere                                     |
|  Shared Foundation: RBAC Auth (JWT/Bcrypt) | Notifications | Auditing | Database  |
+-----------------------------------------+-----------------------------------------+
|    Requirement A: Service Desk Module   |     Requirement B: Task Management      |
|  - Concurrency-safe IDs (WRK-2026-XXXX) |  - Sequential Task IDs (TSK-XXXX)       |
|  - Request Lifecycle State Machine      |  - 5-Column Interactive Kanban Board    |
|  - Multi-tier SLA Engine & Deadlines    |  - Due Dates & Overdue Detection        |
|  - Confidential Agent-Only Notes        |  - Team Member Workload Allocation      |
|  - Departmental Routing & Assignments   |  - Task Comment Collaboration           |
+-----------------------------------------+-----------------------------------------+
                                      |
                     [Bi-directional Cross-Module Link]
        Support Agents link fulfillment tasks directly to customer requests
```

### Requirement A — Employee Service Request System (Project 2)
An internal company service desk portal where employees submit IT, HR, Facilities, and Operational requests. Support agents manage these tickets through a dedicated queue, administrators balance workload assignments, and the system enforces Service Level Agreements (SLAs) with live countdown timers, breach detection, and audit histories.

### Requirement B — Full Stack Task Management System with Database (Prescribed Task 2)
An operational task platform where teams coordinate cross-functional activities. Authorized users create tasks, assign colleagues, assign priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), track due dates, collaborate through comments, and update status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `COMPLETED`) on an interactive Kanban board with instant PostgreSQL persistence.

### Cross-Module Integration Workflow
The two modules remain conceptually and operationally distinct, connected through a real-world enterprise workflow:
1. An employee submits an IT service request (`WRK-2026-0001`) for workstation setup.
2. An administrator or lead agent assigns it to a support specialist.
3. The specialist creates one or more linked tasks (`TSK-1001`, `TSK-1002`) to handle discrete fulfillment activities (hardware testing, cable delivery, asset tagging).
4. Task progress and request lifecycle remain decoupled, while bi-directional links and activity timelines provide complete operational traceability.

---

## 2. Architecture Overview

WorkSphere employs a clean 3-tier architecture with clear separation of concerns:

```
[ Browser Client: React 18 SPA ]
           │
           │ HTTPS / REST JSON (Axios, TanStack Query)
           ▼
[ Express.js API Gateway & Controllers ]
   ├── Authentication & RBAC Middleware (JWT, bcrypt)
   ├── Input Validation Layer (Zod Schemas)
   ├── Security Headers & CORS (Helmet, Configured Origins)
   └── SLA Calculation & State Transition Engines
           │
           │ Prisma Client ORM (Type-Safe Queries & Transactions)
           ▼
[ PostgreSQL 16+ Relational Database ]
   ├── Fully Normalized Schema (Users, Requests, Tasks, SLAs, Logs)
   ├── Foreign Key Constraints & Cascades
   └── B-Tree Indexes on Queried Columns & Filter Attributes
```

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5.6 | Single Page Application (SPA) architecture |
| **Styling & UI** | Tailwind CSS 3.4, Lucide React, Framer Motion | Modern, responsive enterprise interface |
| **State & Data** | TanStack Query v5, React Hook Form, Zod, Axios | Server caching, client validation, API client |
| **Data Viz** | Recharts | Live operational metrics and workload distributions |
| **Backend** | Node.js 22 LTS, Express.js 4.21, TypeScript | RESTful API server with modular controllers |
| **Security** | Helmet, bcrypt, JSON Web Tokens (JWT), CORS | Defense-in-depth protection and RBAC |
| **Database** | PostgreSQL 16+, Prisma ORM 5.22 | Relational storage, schema migrations, type-safe queries |
| **Testing** | Vitest, Supertest | Fast unit, API endpoint, and end-to-end integration tests |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions | Multi-stage container builds and automated CI pipeline |

---

## 4. UI Walkthrough & Screenshots

> *Tip: Screenshots can be captured directly from the running application at `http://localhost:5173`.*

### System Overview & Analytics Dashboard
*Comprehensive KPI metric cards, SLA compliance distribution, and task workload breakdown.*
```
+-----------------------------------------------------------------------------------+
|  [Total Requests: 4]  [Active Tasks: 5]  [SLA Compliance: 100%]  [Urgent SLA: 1]  |
|                                                                                   |
|  [ Request Status Distribution Chart ]       [ Task Velocity & Priority Chart ]   |
|  [ Recent Service Requests Table     ]       [ Active Workload Assignments    ]   |
+-----------------------------------------------------------------------------------+
```

### Interactive Kanban Task Board
*5-column drag-and-drop / click-to-move board with priority badges, overdue indicators, and assignee avatars.*
```
+--------------+---------------+---------------+---------------+---------------+
|    TO DO     |  IN PROGRESS  |   IN REVIEW   |    BLOCKED    |   COMPLETED   |
+--------------+---------------+---------------+---------------+---------------+
| TSK-1004     | TSK-1001      | TSK-1003      | TSK-1005      | TSK-1002      |
| WCAG Audit   | 4K Displays   | OAuth2 PKCE   | HVAC Chiller  | Barcode Tags  |
| Medium       | High          | Urgent        | Urgent (Wait) | Medium        |
+--------------+---------------+---------------+---------------+---------------+
```

### Service Request Detail & SLA Countdown
*Live countdown timer, lifecycle state control, public discussion thread, and confidential internal agent notes.*

---

## 5. Features by User Role

WorkSphere enforces strict backend Role-Based Access Control (`EMPLOYEE`, `AGENT`, `ADMIN`):

### 👤 Employee
- **Service Requests**: Create new requests with categories, subcategories, priorities, and descriptions.
- **Tracking**: View personal requests, track real-time SLA countdown timers, and view resolution statuses.
- **Communication**: Add public comments and reply to support agents.
- **Tasks**: View tasks assigned to them, inspect due dates, and update task statuses.
- **Notifications**: Receive instant in-app alerts for ticket progress, assignments, and comments.

### 🛠️ Support Agent
- **Queue Management**: View assigned and department service requests; filter by category, status, and SLA risk.
- **Lifecycle Control**: Transition tickets through authorized states (`IN_PROGRESS`, `WAITING_FOR_EMPLOYEE`, `RESOLVED`, `REOPENED`).
- **Confidential Notes**: Post private internal notes strictly invisible to employees.
- **Task Fulfillment**: Create operational sub-tasks (`TSK-XXXX`) linked directly to service requests.
- **Workload Management**: Track personal assigned tasks on the Kanban board.

### 🛡️ Administrator
- **Operational Analytics**: Global metrics on ticket volumes, resolution velocity, and team workload distribution.
- **User Management**: View user directory, update roles, assign departments, and toggle active status.
- **SLA Policy Administration**: Configure target response and resolution times (hours) across priority tiers.
- **Ticket Reassignment**: Reassign tickets between support agents with recorded assignment reasons.
- **Audit Logging**: Comprehensive, immutable activity audit trail covering logins, role changes, and system events.

---

## 6. Project Structure

```
worksphere/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions test & build pipeline
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Committed SQL migrations
│   │   ├── schema.prisma        # Database models & relationships
│   │   └── seed.ts              # Realistic enterprise demo seed script
│   ├── src/
│   │   ├── config/              # Environment config & Prisma client
│   │   ├── controllers/         # REST API route handlers
│   │   ├── middleware/          # JWT auth, RBAC, and error handlers
│   │   ├── routes/              # Express API route definitions
│   │   ├── utils/               # Human-readable ID generators & SLA helpers
│   │   ├── validators/          # Zod schema request validation
│   │   ├── app.ts               # Express application setup & middleware
│   │   └── server.ts            # Server entry point & graceful shutdown
│   ├── tests/
│   │   ├── api.test.ts          # Vitest integration test suite
│   │   └── e2e-workflow.ts      # Multi-role scenario validation
│   ├── Dockerfile               # Multi-stage production container build
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with JWT interceptors
│   │   ├── components/          # Reusable UI components & layouts
│   │   ├── context/             # Authentication & Notification context
│   │   ├── pages/               # Views (Dashboard, Requests, Tasks, Admin)
│   │   ├── types/               # TypeScript interfaces & enums
│   │   ├── App.tsx              # React Router view registry
│   │   └── main.tsx             # React DOM entry point
│   ├── Dockerfile               # Production multi-stage Nginx container build
│   ├── nginx.conf               # Nginx reverse proxy & SPA fallback configuration
│   ├── vercel.json              # Vercel SPA routing configuration
│   ├── package.json
│   └── vite.config.ts
├── docs/                        # Complete technical documentation suite
│   ├── api-documentation.md     # REST API endpoints & request/response samples
│   ├── architecture.md          # System architecture, data flow, & design decisions
│   ├── database-design.md       # Relational schema, indexes, & ER diagram
│   ├── demo-script.md           # Step-by-step evaluator presentation script
│   ├── limitations-and-roadmap.md # Known limitations & future enhancements
│   ├── requirements.md          # Functional & non-functional requirements
│   └── testing.md               # QA verification, test matrix, & evidence
├── .gitignore                   # Multi-tier exclusions (secrets, builds, caches)
├── docker-compose.yml           # Unified multi-container deployment
└── README.md                    # Primary repository guide
```

---

## 7. Prerequisites

- **Node.js**: `v20.x` or `v22.x LTS` (v18.x minimum)
- **Package Manager**: `npm v9+`
- **Database**: PostgreSQL `14+` running locally or via Docker
- **Git**: `2.30+`

---

## 8. Local Installation Instructions

Frontend and backend are independently installable and buildable.

### Step 1: Clone Repository
```bash
git clone https://github.com/<your-username>/worksphere.git
cd worksphere
```

### Step 2: Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL connection string:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/worksphere?schema=public"

# 3. Apply database migrations
npx prisma migrate dev --name init

# 4. Seed database with enterprise demo records
npx prisma db seed

# 5. Start backend development server
npm run dev
```
Backend API will be running at **`http://localhost:5000`** (Health check: `http://localhost:5000/api/health`).

### Step 3: Frontend Setup
```bash
# In a separate terminal window:
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Default VITE_API_URL=http://localhost:5000/api works out-of-the-box

# 3. Start frontend development server
npm run dev
```
Frontend application will be running at **`http://localhost:5173`**.

---

## 9. Environment Variable Configuration

### Backend (`backend/.env`)

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Port for Express API server |
| `NODE_ENV` | Yes | `development` / `production` | Environment runtime flag |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | *Use random 32+ character string* | Key for signing authentication tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity window |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |

### Frontend (`frontend/.env`)

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Base URL for backend API endpoints |

---

## 10. Database Migration & Seeding Instructions

### Development Migrations
When adding new fields or entities to `backend/prisma/schema.prisma`:
```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

### Production Migrations
In production environments (e.g., Render, Railway, Docker), apply migrations without dev tools:
```bash
cd backend
npm run prisma:migrate:deploy
```

### Seeding Strategy
- **Development/Staging**: Run `npm run prisma:seed` to populate the database with realistic sample users, tickets, SLA policies, and tasks.
- **Production Guard**: `seed.ts` contains an automated safety check. If `NODE_ENV=production`, seeding is automatically blocked to prevent wiping real company data. To override on staging instances, set `FORCE_SEED=true`.

---

## 11. Testing Instructions

WorkSphere includes automated test suites covering unit logic, REST API endpoints, and complete multi-role workflows:

```bash
# Run backend API test suite (13 integration tests)
cd backend
npm test

# Run backend end-to-end multi-role scenario validation (30 assertions)
npx tsx tests/e2e-workflow.ts

# Run frontend test suite (5 assertions)
cd ../frontend
npm test

# Validate TypeScript builds without errors
cd ../backend && npm run build
cd ../frontend && npm run build
```

---

## 12. Docker Deployment

Deploy the complete multi-container production stack (PostgreSQL, Backend API, Frontend Nginx) with Docker Compose:

```bash
# Build and launch all services in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

### Exposed Endpoints
- **Frontend SPA**: `http://localhost:80`
- **Backend API**: `http://localhost:5000/api`
- **Backend Health**: `http://localhost:5000/api/health`
- **PostgreSQL**: Bound to `127.0.0.1:5432` (internal Docker network; shielded from public interfaces)

---

## 13. Production Deployment Architecture

```
       [ Users / Web Browsers ]
                  │
                  ▼
       [ Frontend Hosting: Vercel / Netlify ]
       - Static SPA build (`dist/`)
       - Client-side routing with `vercel.json` rewrites
       - Environment: `VITE_API_URL=https://api.yourdomain.com/api`
                  │
                  ▼ HTTPS
       [ Backend Hosting: Render / Railway / AWS ECS ]
       - Node.js 22 LTS container
       - Environment:
           PORT=5000
           NODE_ENV=production
           DATABASE_URL=postgresql://...?sslmode=require
           JWT_SECRET=<generated-random-32-chars>
           CORS_ORIGIN=https://yourdomain.com
       - Build Command: `npm ci && npx prisma generate && npm run build`
       - Start Command: `npx prisma migrate deploy && node dist/server.js`
                  │
                  ▼ Secure SSL VPC / Connection Pool
       [ Managed PostgreSQL: Neon / Supabase / AWS RDS ]
       - Automated daily backups
       - SSL enforced (`sslmode=require`)
```

---

## 14. Demo Credentials

> ⚠️ **CRITICAL SECURITY NOTICE:**
> The credentials below are **MOCK DEMO ACCOUNTS FOR LOCAL DEVELOPMENT & EVALUATION ONLY**.
> Never use these credentials, email addresses, or default passwords in a production deployment.

The development database comes pre-seeded with realistic enterprise records across all roles:

| Role | Email | Password | Responsibilities |
|---|---|---|---|
| **Administrator** | `admin@worksphere.internal` | `Admin@123` | System oversight, SLA policies, user directory, audit trails |
| **Support Agent (IT)** | `agent.marcus@worksphere.internal` | `Agent@123` | Ticket queue, assignments, internal notes, resolution |
| **Support Agent (HR)** | `agent.clara@worksphere.internal` | `Agent@123` | People operations, onboarding requests |
| **Employee (Alex)** | `employee.alex@worksphere.internal` | `Employee@123` | Submitting requests, viewing own requests, assigned tasks |
| **Employee (Elena)** | `employee.elena@worksphere.internal` | `Employee@123` | Marketing team employee |
| **Employee (David)** | `employee.david@worksphere.internal` | `Employee@123` | Product designer employee |

*Note: The login page includes **One-Click Demo Account Quick-Fill Buttons** to streamline live evaluator demonstrations.*

---

## 15. Known Limitations & Engineering Roadmap

Detailed in [`docs/limitations-and-roadmap.md`](./docs/limitations-and-roadmap.md):
- **Real-Time Push**: Current notification updates use client polling. Future milestone includes WebSocket / SSE streaming.
- **File Attachments**: File metadata is saved in PostgreSQL; production roadmap incorporates S3/Cloud Storage presigned URLs.
- **Multi-Tenant Partitioning**: Designed for single-organization deployment; roadmap includes organizational tenant isolation.

---

## 16. Technical Documentation Suite

Comprehensive engineering documentation is available in the [`docs/`](./docs) directory:

- 📋 [**Requirements Specification**](./docs/requirements.md) — Dual-module functional & non-functional requirements.
- 🏗️ [**System Architecture & Data Flow**](./docs/architecture.md) — Component interactions, state machines, and security architecture.
- 🔌 [**REST API Documentation**](./docs/api-documentation.md) — Route catalog, request payloads, response structures, and status codes.
- 🗄️ [**Database Design & ER Model**](./docs/database-design.md) — Relational schema, indexes, SLA policies, and foreign key rules.
- 🧪 [**Testing Report & Evidence**](./docs/testing.md) — Automated testing matrix, coverage evidence, and security verification.
- 🧭 [**Evaluation Viva & Demo Script**](./docs/demo-script.md) — 10-minute presentation guide for internship evaluators.
- 🚀 [**Limitations & Technical Roadmap**](./docs/limitations-and-roadmap.md) — Production hardening recommendations.

---

## 17. License

This project was developed for the **Arrowstack Full Stack Development Internship**. Distributed under the MIT License.
