# Evaluation Viva & Live Demonstration Script: WorkSphere

This script outlines the exact live demonstration workflows to showcase during the Arrowstack internship project review and technical viva.

---

## 1. Demo Credentials Quick Reference

| Account | Email | Password | Role |
|---|---|---|---|
| **Administrator** | `admin@worksphere.internal` | `Admin@123` | System Admin |
| **IT Specialist** | `agent.marcus@worksphere.internal` | `Agent@123` | Support Agent |
| **Employee** | `employee.alex@worksphere.internal` | `Employee@123` | Submitter / Engineer |

---

## 2. Demonstration A — Employee Service Request (Module A)

1. **Login as Employee**:
   - Open `http://localhost:5173/login`.
   - Click the **Employee (Alex R.)** quick demo button.
   - Click **Sign In**.
2. **Review Personal Dashboard**:
   - Point out real database KPI numbers (Submitted requests, Active tickets).
   - Point out that Alex only sees his own tickets, not other employees' private records.
3. **Submit a New Service Request**:
   - Click **Create Service Request**.
   - Fill in:
     - Title: `Request for Extra Laptop Charger and Surge Protector`
     - Category: `Software and Hardware`
     - Priority: `Medium`
     - Description: `Need a secondary USB-C 100W PD charger for remote workstation setup in Bay 14.`
   - Click **Submit Request**.
   - Notice the newly generated unique request ID: `WRK-2026-0005` (concurrency-safe sequence).
   - Point out the active SLA resolution countdown timer and progress indicator.
4. **Login as Administrator / Agent to Assign**:
   - Click user dropdown → Sign Out.
   - Click the **Admin (Sarah J.)** quick demo button → Sign In.
   - Navigate to **All Requests**.
   - Open ticket `WRK-2026-0005`.
   - Click **Assign Agent** → Select `Marcus Vance (Senior Systems Support Engineer)`.
   - Notice the activity timeline logs: `Assigned to Marcus Vance by Sarah Jenkins (Admin)`.
5. **Agent Fulfillment & Internal Notes**:
   - Sign in as `agent.marcus@worksphere.internal`.
   - Open `WRK-2026-0005`.
   - Switch to the **Internal Notes** tab:
     - Enter: `Asset Tag AST-9920 checked out of storage room. Serial: CHG-8812.`
     - Click **Add Private Note**.
   - Switch to **Discussion** tab:
     - Enter: `Hi Alex, charger is packed and ready for drop-off at 3 PM.`
   - Click **Update Status** → change to `IN_PROGRESS`.
   - Complete work and update status to `RESOLVED`.
6. **Verify Confidentiality as Employee**:
   - Log back in as `employee.alex@worksphere.internal`.
   - Open `WRK-2026-0005`.
   - Notice that the public comment is visible, but the **Internal Notes tab does not exist**, proving backend security isolation!

---

## 3. Demonstration B — Task Management & Kanban Board (Module B)

1. **Login as Admin or Agent**:
   - Navigate to **Task Board** (`/tasks/board`).
2. **Demonstrate Kanban Columns**:
   - Columns: `To Do`, `In Progress`, `In Review`, `Blocked`, `Completed`.
   - Highlight priority badges (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), task numbers (`TSK-1001`), due dates, and assignee avatars.
3. **Create a New Operational Task**:
   - Click **Create Task** (`/tasks/new`).
   - Title: `Perform Annual Security Audit on AWS IAM Roles`
   - Task Type: `Investigation`
   - Priority: `Urgent`
   - Assignee: `Alex Rivera`
   - Due Date: Set to tomorrow.
   - Labels: `Security, IAM, Cloud`
   - Click **Create Task**.
4. **Persist Kanban Card Movement**:
   - On the task board, find the newly created task card in `To Do`.
   - Change its status dropdown to `In Progress`.
   - Open DevTools Network tab or PostgreSQL: verify an actual `PATCH /api/tasks/:id/status` request occurred and persisted to PostgreSQL!
5. **Task Collaboration & Comments**:
   - Click on the task to open **Task Details** (`/tasks/TSK-XXXX`).
   - Add a comment: `Audit started. Analyzing unused IAM roles.`
   - Point out that comments display author name, timestamp, and delete permission.

---

## 4. Demonstration C — Integrated Workflow (Module A + Module B)

1. **Open Service Request `WRK-2026-0001`**:
   - Notice the section **Linked Tasks (2)**.
   - Show tasks `TSK-1001` (Deploy Displays) and `TSK-1002` (Scan Barcodes) linked directly to the request.
2. **Create a 3rd Linked Task**:
   - Click **Create Linked Task**.
   - Title: `Verify Ergonomic Dual-Arm Tension at Desk B-3-14`
   - Priority: `Medium`
   - Click **Create & Link Task**.
3. **Trace the Bi-Directional Relationship**:
   - Click on the new task: notice the prominent purple banner:
     `Integrated Operational Task: Linked to Service Request WRK-2026-0001 — Dual 4K Monitor Requisition`.
   - Click **View Service Request** to jump straight back to the original ticket.
4. **Independent Lifecycle Demonstration**:
   - Show that moving the task across Kanban columns does NOT prematurely close the service request.
   - Both modules maintain separation of concerns while offering seamless operational traceability.

---

## 5. Technical Interview Viva Preparation Points

- **Q: Why are there two separate modules instead of one?**
  - *A: An employee service request represents a client-facing SLA-bound ticket (IT problem, HR inquiry, hardware requisition). A task represents discrete operational work units assigned to team members. One request often requires multiple tasks (e.g. procurement, bench testing, physical installation) performed by different technicians.*
- **Q: How is security enforced beyond hiding buttons on the frontend?**
  - *A: Backend Express middleware (`auth.middleware.ts`) verifies the JWT on every request. Queries in `request.controller.ts` automatically inject `where.creatorId = user.id` if caller is an EMPLOYEE. Internal notes are filtered in the database query (`select` or `filter`) so raw database records never leave the server.*
- **Q: How does SLA calculation work?**
  - *A: `slaCalculator.ts` queries the `SLAPolicy` table by priority, calculates UTC deadlines from creation time, and dynamically computes remaining hours and compliance status (`ON_TRACK`, `AT_RISK`, `BREACHED`, `MET`).*
- **Q: How does the Kanban board persist data?**
  - *A: Each status update triggers an authenticated `PATCH /api/tasks/:id/status` request, updating the `Task` status in PostgreSQL and recording a timestamped audit entry in `TaskActivity`.*
