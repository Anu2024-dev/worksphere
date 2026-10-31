# Requirements Specification: WorkSphere

## 1. Executive Summary & Problem Statement
Modern enterprises face operational friction when managing internal employee requests and daily operational tasks:
1. Fragmented communication across Slack, email, and sticky notes leads to tickets falling through the cracks.
2. Inability to track Service Level Agreements (SLAs) causes prolonged downtime for employee hardware, access credentials, and payroll inquiries.
3. Lack of unified task visibility prevents team leads from monitoring work across cross-functional dependencies.

**WorkSphere** addresses these challenges by providing an integrated operations platform that satisfies two distinct, rigorous functional requirements.

---

## 2. Requirement A: Employee Service Request System (Project 2)

### Functional Requirements
- **FR-A1: Service Request Submission**: Employees must be able to submit structured service requests with title, detailed description, category, subcategory, priority, department, and contact info.
- **FR-A2: Concurrency-Safe Request IDs**: Every ticket must receive a human-readable identifier formatted as `WRK-YYYY-XXXX` (e.g., `WRK-2026-0001`).
- **FR-A3: Lifecycle State Machine**: Tickets must follow a strict transition matrix:
  - `OPEN` → `ASSIGNED`, `IN_PROGRESS`, `CLOSED`
  - `ASSIGNED` → `IN_PROGRESS`, `WAITING_FOR_EMPLOYEE`, `CLOSED`
  - `IN_PROGRESS` → `WAITING_FOR_EMPLOYEE`, `RESOLVED`, `CLOSED`
  - `WAITING_FOR_EMPLOYEE` → `IN_PROGRESS`, `RESOLVED`, `CLOSED`
  - `RESOLVED` → `CLOSED`, `REOPENED`
  - `CLOSED` → `REOPENED`
  - `REOPENED` → `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- **FR-A4: SLA Policy Engine**: System must calculate `responseDeadline` and `resolutionDeadline` based on priority:
  - `CRITICAL`: 4h resolution (24/7 calendar hours)
  - `HIGH`: 8h resolution
  - `MEDIUM`: 24h resolution
  - `LOW`: 48h resolution
  Remaining time, warning alerts, and breach statuses must be evaluated in real time.
- **FR-A5: Confidential Internal Notes**: Support agents must be able to leave private notes that are filtered and never transmitted to employees.
- **FR-A6: Assignment History**: Whenever a ticket is assigned or reassigned, an immutable record of assigner, assignee, timestamp, and reason must be recorded.

---

## 3. Requirement B: Full Stack Task Management System (Prescribed Task 2)

### Functional Requirements
- **FR-B1: Task Creation**: Authorized users can create operational tasks with title, description, task type, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), department, assignee, due date, estimated hours, and labels.
- **FR-B2: Task Identifiers**: Sequential identifiers formatted as `TSK-XXXX` (e.g., `TSK-1001`).
- **FR-B3: Interactive Kanban Board**: 5 columns (`To Do`, `In Progress`, `In Review`, `Blocked`, `Completed`) where cards display task number, priority indicator, assignee initials, due date, and labels. Status updates persist directly to PostgreSQL.
- **FR-B4: Collaboration & Comments**: Team members can post comments, delete own comments, and view an audit trail of task activity.
- **FR-B5: Real Database-Driven Metrics**: Metrics on total tasks, completion percentage, overdue tasks, due soon tasks, and team workload must reflect real database records.

---

## 4. Module Integration Requirements

- **IR-1: Bi-Directional Linking**: A Service Request may be linked to multiple operational tasks. A Task can optionally reference one Service Request.
- **IR-2: Independent Lifecycles**: Completing linked tasks does not automatically close a service ticket unless explicitly authorized by the support agent, preserving separation of concerns.
- **IR-3: Traceability**: Linked tasks appear directly on the Service Request details page, and the linked request is prominently displayed with a deep link on the Task details page.

---

## 5. Non-Functional Requirements
- **NFR-1 Security**: Passwords hashed with bcrypt (salt 10). JWT tokens verified on every protected API call. Backend RBAC strictly enforced on data queries.
- **NFR-2 Performance**: Fast database queries with indexes on foreign keys, status, priority, and timestamps.
- **NFR-3 Usability**: Modern, minimal, Linear/Notion-inspired design system with smooth Framer Motion transitions and responsive layout.
