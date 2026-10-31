# REST API Documentation: WorkSphere

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP header:
`Authorization: Bearer <jwt-token>`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "admin@worksphere.internal",
    "password": "Admin@123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Authentication successful.",
    "data": {
      "user": {
        "id": "uuid",
        "name": "Sarah Jenkins (Admin)",
        "email": "admin@worksphere.internal",
        "role": "ADMIN",
        "department": { "id": "uuid", "name": "Information Technology" }
      },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

### `GET /api/auth/me`
Retrieves currently authenticated user profile and team memberships.

### `PATCH /api/auth/password`
Updates the authenticated user's password.
- **Request Body**:
  ```json
  {
    "currentPassword": "Employee@123",
    "newPassword": "NewSecurePassword@2026"
  }
  ```

---

## 2. Service Request Endpoints (Module A)

### `GET /api/requests`
Returns paginated service requests scoped to caller's role.
- **Query Parameters**: `status`, `priority`, `categoryId`, `departmentId`, `assignedAgentId`, `search`, `page`, `limit`.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "requestId": "WRK-2026-0001",
        "title": "Dual 4K Monitor Requisition",
        "priority": "MEDIUM",
        "status": "IN_PROGRESS",
        "slaEvaluation": {
          "isOverdue": false,
          "remainingMinutes": 240,
          "slaStatus": "ON_TRACK",
          "compliancePercentage": 85
        }
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
  ```

### `POST /api/requests`
Creates a new service request and computes SLA deadlines.
- **Request Body**:
  ```json
  {
    "title": "Dual 4K Monitor Requisition",
    "description": "Need two 27-inch displays for developer workstation.",
    "categoryId": "uuid",
    "priority": "MEDIUM",
    "contactInfo": "Slack: @alex.rivera"
  }
  ```

### `GET /api/requests/:id`
Retrieves request details, comments, timeline, and linked tasks.
*Note: If caller is an EMPLOYEE, comments flagged as `isInternal: true` are automatically excluded.*

### `PATCH /api/requests/:id/status`
Updates request lifecycle status. Validates transition matrix.
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "note": "Hardware delivered and connected."
  }
  ```

### `PATCH /api/requests/:id/assign`
Assigns or reassigns ticket to an agent. (Admin/Agent only).
- **Request Body**:
  ```json
  {
    "assigneeId": "uuid-of-agent",
    "reason": "Hardware queue specialization"
  }
  ```

### `POST /api/requests/:id/comments`
Posts a comment or confidential internal note.
- **Request Body**:
  ```json
  {
    "content": "Delivering monitors to desk Bay 14.",
    "isInternal": false
  }
  ```

---

## 3. Task Management Endpoints (Module B)

### `GET /api/tasks`
Lists operational tasks with filters for status, priority, assignee, and overdue status.

### `POST /api/tasks`
Creates a new task.
- **Request Body**:
  ```json
  {
    "title": "Deliver Dell displays to Desk B-3-14",
    "description": "VESA mounting instructions included.",
    "taskType": "SUPPORT_WORK",
    "priority": "HIGH",
    "status": "TODO",
    "assigneeId": "uuid",
    "dueDate": "2026-11-05T18:00:00.000Z",
    "labels": ["Hardware", "Fulfillment"],
    "serviceRequestId": "uuid-optional"
  }
  ```

### `PATCH /api/tasks/:id/status`
Persists status movement (used by Kanban board).
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "note": "Commenced hardware deployment"
  }
  ```

### `POST /api/tasks/:id/comments`
Adds a collaboration comment on a task.

---

## 4. Module Integration Endpoints

### `GET /api/requests/:id/tasks`
Lists all operational tasks linked to a specific service request.

### `POST /api/requests/:id/tasks`
Creates a new task or links an existing task directly to a service request.
- **Request Body**:
  ```json
  {
    "taskId": "uuid-optional-existing-task",
    "title": "Deploy Monitors",
    "priority": "HIGH"
  }
  ```

### `DELETE /api/requests/:requestId/tasks/:taskId`
Unlinks a task from a service request while preserving both records independently.

---

## 5. Dashboard Endpoints

- `GET /api/dashboard/employee`: Real metrics for employee view (requests, open tickets, assigned tasks).
- `GET /api/dashboard/agent`: Ticket queues, critical alerts, assigned tasks.
- `GET /api/dashboard/admin`: System-wide KPIs, SLA compliance %, category breakdowns, audit activity.
- `GET /api/dashboard/tasks`: Kanban metrics, workload distribution, priority breakdown.
