# WorkSphere — Enterprise Employee Service Desk & Task Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-indigo.svg)]()

> **WorkSphere** is a centralized internal operations SaaS platform engineered for enterprise employee service desks and team task management. Developed as a portfolio and internship capstone project for the **Arrowstack Full Stack Development Internship**.

---

## 1. Project Overview & Two Core Requirements

WorkSphere integrates **TWO distinct, fully realized functional modules** within a unified enterprise architecture:

### Requirement A — Employee Service Request System (Project 2)
An internal company service desk portal where employees raise IT, HR, Facilities, and Operational requests. Support agents manage these tickets through a dedicated queue, administrators balance workload assignments, and the system enforces Service Level Agreements (SLAs) with live countdown timers, breach detection, and audit histories.

### Requirement B — Full Stack Task Management System with Database (Prescribed Task 2)
An operational task platform where teams coordinate cross-functional activities. Authorized users create tasks, assign colleagues, assign priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), track due dates, collaborate through comments, and update status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `COMPLETED`) on an interactive Kanban board with instant PostgreSQL persistence.

### Distinct Module Integration
The two modules remain conceptually and operationally distinct, connected through a real-world enterprise workflow:
- An employee submits an IT service request (`WRK-2026-0001`).
- An administrator assigns it to a support specialist.
- The specialist creates one or more linked tasks (`TSK-1001`, `TSK-1002`) to handle discrete fulfillment activities (hardware testing, cable delivery, asset tagging).
- Task progress and request lifecycle remain decoupled, while bi-directional links and activity timelines provide complete traceability.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion, React Router v6, Axios, Recharts |
| **Backend** | Node.js, Express.js, TypeScript, RESTful API, Prisma ORM, JWT, bcrypt, Zod, Helmet, Morgan |
| **Database** | PostgreSQL with committed migrations, referential foreign keys, and indexes |
| **Testing** | Vitest, Supertest, React Testing Library |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles |

---

## 3. Demo Credentials

The development database comes pre-seeded with realistic enterprise records across all roles:

| Role | Email | Password | Responsibilities |
|---|---|---|---|
| **Administrator** | `admin@worksphere.internal` | `Admin@123` | System oversight, SLA policies, user management, audit trails |
| **Support Agent (IT)** | `agent.marcus@worksphere.internal` | `Agent@123` | Ticket queue, assignments, internal notes, resolution |
| **Support Agent (HR)** | `agent.clara@worksphere.internal` | `Agent@123` | People operations, onboarding requests |
| **Employee (Alex)** | `employee.alex@worksphere.internal` | `Employee@123` | Submitting requests, viewing own requests, assigned tasks |
| **Employee (Elena)** | `employee.elena@worksphere.internal` | `Employee@123` | Marketing team employee |
| **Employee (David)** | `employee.david@worksphere.internal` | `Employee@123` | Product designer employee |

*Note: The login page includes convenient **One-Click Demo Account** quick-fill buttons for live evaluator presentations.*

---

## 4. Key Functional Capabilities

### Module A: Service Request System
- **Human-Readable Request IDs**: Concurrency-safe unique identifiers (e.g., `WRK-2026-0001`).
- **Validated Lifecycle State Machine**: Enforces strict transitions across `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `WAITING_FOR_EMPLOYEE` → `RESOLVED` → `CLOSED` → `REOPENED`.
- **SLA Engine**: Calculates response & resolution deadlines based on priority (`CRITICAL`: 4h, `HIGH`: 8h, `MEDIUM`: 24h, `LOW`: 48h). Tracks remaining time, warning thresholds, and overdue compliance percentages.
- **Confidential Internal Notes**: Private agent notes are strictly filtered and hidden from employees on the backend.
- **Assignment History**: Preserves assignment history and reason whenever tickets are reassigned.

### Module B: Task Management System
- **Kanban Board**: 5 columns (`To Do`, `In Progress`, `In Review`, `Blocked`, `Completed`) with real-time status transitions persisted to PostgreSQL.
- **Task Numbers**: Sequential identifiers (e.g., `TSK-1001`).
- **Overdue Tracking**: Visual indicators and filtering for tasks past their deadline.
- **Collaboration**: Task commenting timeline with author timestamps and delete permissions.
- **Database-Driven Dashboard**: Real metrics on completion percentage, workload distribution, and priority breakdowns.

---

## 5. Local Setup & Quick Start

### Prerequisites
- Node.js v18+ (Node 22 LTS recommended)
- PostgreSQL 14+ running locally (or via Docker)

### 1. Clone Repository & Setup Environment
```bash
git clone <repo-url>
cd esrs
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment in .env
cp .env.example .env

# Run Prisma migration & seed database
npx prisma migrate dev --name init
npx prisma db seed

# Run automated test suite
npm test

# Start backend dev server (port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env

# Start frontend dev server (port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Docker Deployment

To launch the complete production stack (PostgreSQL, Backend API, Frontend Nginx) with one command:
```bash
docker compose up --build
```
- Frontend: [http://localhost:80](http://localhost:80)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- PostgreSQL: Port 5432

---

## 7. Technical Documentation

Comprehensive architectural and engineering documentation is available in the [`docs/`](./docs) folder:
- [Requirements Specification](./docs/requirements.md)
- [System Architecture & Data Flow](./docs/architecture.md)
- [REST API Specification](./docs/api-documentation.md)
- [Database Schema & ER Design](./docs/database-design.md)
- [Testing Report & Verification Evidence](./docs/testing.md)
- [Limitations & Engineering Roadmap](./docs/limitations-and-roadmap.md)
- [Evaluation Viva & Demo Script](./docs/demo-script.md)
