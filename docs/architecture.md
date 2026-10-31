# Architecture & System Design: WorkSphere

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|   React 18 + Vite + TypeScript + Tailwind CSS + Lucide React + Framer Motion      |
|   - Employee Desk            - Agent Queue             - Admin Center             |
|   - Service Request Detail   - Kanban Task Board       - SLA Policy Editor        |
|   - Notification Popover     - Global Search Dialog    - Analytics (Recharts)     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | JSON over HTTPS (REST API)
                                          | Bearer JWT Authorization
                                          v
+-----------------------------------------------------------------------------------+
|                                 BACKEND LAYER                                     |
|                                                                                   |
|   Node.js + Express.js + TypeScript                                               |
|   +---------------------+  +----------------------+  +-------------------------+  |
|   |   Auth & RBAC       |  |   Service Desk Core  |  |   Task Management Core  |  |
|   |   Middleware        |  |   (Module A)         |  |   (Module B)            |  |
|   +---------------------+  +----------------------+  +-------------------------+  |
|   | SLA Calculator      |  | ID Generator         |  | Notifications & Audit   |  |
|   | Engine              |  | (WRK / TSK)          |  | Middleware              |  |
|   +---------------------+  +----------------------+  +-------------------------+  |
|                                         |                                         |
|                                 Prisma ORM Layer                                  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | PostgreSQL Connection Pool
                                          v
+-----------------------------------------------------------------------------------+
|                                DATABASE LAYER                                     |
|                                                                                   |
|   PostgreSQL Relational Storage                                                   |
|   - Users, Roles, Depts, Teams         - ServiceRequests, Comments, Assignments   |
|   - Tasks, TaskComments, Activities    - SLAPolicies, AuditLogs, Notifications    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee / Agent / Admin
    participant Client as Frontend (React)
    participant Auth as Auth Middleware (Express)
    participant DB as PostgreSQL (Prisma)

    User->>Client: Enters credentials (email & password)
    Client->>Auth: POST /api/auth/login
    Auth->>DB: Query user by email & active status
    DB-->>Auth: User record & bcrypt hash
    Auth->>Auth: Compare password with bcrypt
    Auth->>Client: Return signed JWT Token + Safe User Profile
    Client->>Client: Store token in localStorage
    
    User->>Client: Navigates to protected view
    Client->>Auth: GET /api/requests (Header: Authorization Bearer <token>)
    Auth->>Auth: Verify JWT signature & expiration
    Auth->>DB: Fetch user role and active state
    Auth->>Auth: Enforce Role Scope (Employee: creatorId == user.id)
    Auth->>DB: Execute scoped relational query
    DB-->>Auth: Filtered dataset (stripping private internal notes if Employee)
    Auth-->>Client: 200 OK with sanitized response
```

---

## 3. Module Integration Workflow

```mermaid
flowchart TD
    A["Employee creates Service Request (WRK-2026-0001)"] --> B["SLA Policy Engine sets Response (1h) & Resolution (4h) deadlines"]
    B --> C["Admin assigns ticket to Support Agent (Marcus)"]
    C --> D["Agent analyzes ticket and determines fulfillment steps"]
    D --> E["Agent creates Linked Task 1 (TSK-1001: Deliver Displays)"]
    D --> F["Agent creates Linked Task 2 (TSK-1002: Tag Fixed Assets)"]
    E --> G["Task 1 assigned to field technician, moved across Kanban columns"]
    F --> H["Task 2 completed and verified in hardware registry"]
    G --> I["All fulfillment tasks completed"]
    I --> J["Support Agent reviews and updates Service Request status to RESOLVED"]
    J --> K["Employee receives notification and verifies resolution"]
```

---

## 4. Key Architectural Decisions

1. **Strict Backend-Enforced Authorization**:
   - Rather than relying on client-side component hiding, queries in `request.controller.ts` automatically inject `where.creatorId = user.id` when the caller possesses the `EMPLOYEE` role.
   - Internal notes (`isInternal = true`) are stripped at the database query level for non-agent users.

2. **Concurrency-Safe ID Generation**:
   - Ticket numbers (`WRK-2026-0001`) and task identifiers (`TSK-1001`) use transactional sequence lookups with formatted zero-padding to guarantee uniqueness without exposing raw database UUIDs.

3. **Prisma Transactions for Multi-Entity Updates**:
   - Ticket assignments, status transitions, and linked task creations run inside atomic `prisma.$transaction` blocks to ensure activity timelines and audit logs never desynchronize.
