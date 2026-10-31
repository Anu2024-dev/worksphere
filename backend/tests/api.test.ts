import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

let adminToken: string;
let employeeToken: string;
let agentToken: string;
let testRequestId: string;
let testTaskId: string;

beforeAll(async () => {
  // Login as admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@worksphere.internal', password: 'Admin@123' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.data.token;

  // Login as employee
  const empRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee.alex@worksphere.internal', password: 'Employee@123' });
  expect(empRes.status).toBe(200);
  employeeToken = empRes.body.data.token;

  // Login as agent
  const agentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'agent.marcus@worksphere.internal', password: 'Agent@123' });
  expect(agentRes.status).toBe(200);
  agentToken = agentRes.body.data.token;
});

describe('1. Health and Authentication API', () => {
  it('GET /api/health should return 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('WorkSphere');
  });

  it('POST /api/auth/login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@worksphere.internal', password: 'WrongPassword999' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should return current user profile with department and teams', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('employee.alex@worksphere.internal');
    expect(res.body.data.role).toBe('EMPLOYEE');
    expect(res.body.data.passwordHash).toBeUndefined(); // Password hash never exposed!
  });
});

describe('2. RBAC and Security Boundaries', () => {
  it('GET /api/audit-logs should return 403 Forbidden for EMPLOYEE', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/audit-logs should return 200 for ADMIN', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('3. Employee Service Request System (Module A)', () => {
  it('POST /api/requests should allow employee to create a service request with SLA deadlines', async () => {
    const categoriesRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${employeeToken}`);
    const catId = categoriesRes.body.data[0].id;

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Need IntelliJ IDEA Ultimate License Renewal',
        description: 'My existing IDE subscription key expired today. Need developer enterprise seat key renewed.',
        categoryId: catId,
        priority: 'HIGH',
        contactInfo: 'Slack: @alex.rivera',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.requestId).toMatch(/^WRK-2026-\d{4}$/);
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.resolutionDeadline).toBeDefined();
    testRequestId = res.body.data.id;
  });

  it('GET /api/requests should only return requests created by the employee', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((reqItem: any) => {
      expect(reqItem.creator.email).toBe('employee.alex@worksphere.internal');
    });
  });

  it('Confidentiality: Internal notes must NOT be visible to EMPLOYEE', async () => {
    // 1. Agent adds an internal note to WRK-2026-0001
    const req1 = await prisma.serviceRequest.findFirst({ where: { requestId: 'WRK-2026-0001' } });
    expect(req1).toBeDefined();

    // 2. Fetch as employee Alex (who owns WRK-2026-0001)
    const empView = await request(app)
      .get(`/api/requests/${req1!.id}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(empView.status).toBe(200);
    const hasInternalComments = empView.body.data.comments.some((c: any) => c.isInternal);
    expect(hasInternalComments).toBe(false);

    // 3. Fetch as agent Marcus
    const agentView = await request(app)
      .get(`/api/requests/${req1!.id}`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(agentView.status).toBe(200);
    const agentHasInternal = agentView.body.data.comments.some((c: any) => c.isInternal);
    expect(agentHasInternal).toBe(true);
  });
});

describe('4. Full Stack Task Management System (Module B)', () => {
  it('POST /api/tasks should create a task with human-readable taskNumber', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        title: 'Provision License Server Key in JetBrains Portal',
        description: 'Log into organization JetBrains admin portal and assign floating seat to Alex Rivera.',
        taskType: 'SUPPORT_WORK',
        priority: 'HIGH',
        status: 'TODO',
        labels: ['License', 'IDE'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.taskNumber).toMatch(/^TSK-\d+$/);
    expect(res.body.data.status).toBe('TODO');
    testTaskId = res.body.data.id;
  });

  it('PATCH /api/tasks/:id/status should update task status and persist in PostgreSQL', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${testTaskId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'IN_PROGRESS', note: 'Generating license key.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');

    const dbTask = await prisma.task.findUnique({ where: { id: testTaskId } });
    expect(dbTask?.status).toBe('IN_PROGRESS');
  });
});

describe('5. Integration Between Service Requests and Tasks', () => {
  it('POST /api/requests/:id/tasks should link task to service request', async () => {
    const res = await request(app)
      .post(`/api/requests/${testRequestId}/tasks`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ taskId: testTaskId });

    expect(res.status).toBe(201);
    expect(res.body.data.serviceRequestId).toBe(testRequestId);

    // Check request tasks endpoint
    const linkedRes = await request(app)
      .get(`/api/requests/${testRequestId}/tasks`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(linkedRes.status).toBe(200);
    expect(linkedRes.body.data.some((t: any) => t.id === testTaskId)).toBe(true);
  });
});

describe('6. Database-Driven Dashboards', () => {
  it('GET /api/dashboard/employee should return real database counts', async () => {
    const res = await request(app)
      .get('/api/dashboard/employee')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalMyRequests).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.recentRequests)).toBe(true);
  });

  it('GET /api/dashboard/tasks should return real metrics and workload distribution', async () => {
    const res = await request(app)
      .get('/api/dashboard/tasks')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalTasks).toBeGreaterThanOrEqual(1);
    expect(res.body.data.priorityBreakdown).toBeDefined();
    expect(res.body.data.statusBreakdown).toBeDefined();
  });
});
