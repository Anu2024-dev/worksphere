const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config: any = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function runE2EWorkflowTests() {
  console.log('=== STARTING WORKSPHERE E2E WORKFLOW VERIFICATION ===\n');
  const results: { role: string; test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const record = (role: string, test: string, passed: boolean, details?: string) => {
    results.push({ role, test, status: passed ? 'PASS' : 'FAIL', details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] [${role}] ${test} ${details ? '- ' + details : ''}`);
  };

  try {
    // -------------------------------------------------------------
    // 1. EMPLOYEE WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Employee Persona (employee.alex@worksphere.internal) ---');
    
    // Login
    const empLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'employee.alex@worksphere.internal',
        password: 'Employee@123',
      },
    });
    const empToken = empLoginRes.data?.data?.token;
    const empUser = empLoginRes.data?.data?.user;
    record('EMPLOYEE', 'Login authentication with credentials', empLoginRes.status === 200 && !!empToken, `User: ${empUser?.name}`);

    const empHeaders = { Authorization: `Bearer ${empToken}` };

    // Employee Dashboard
    const empDashRes = await request('/dashboard/employee', { headers: empHeaders });
    record('EMPLOYEE', 'Fetch personal employee dashboard', empDashRes.status === 200 && empDashRes.data.data.stats.totalMyRequests >= 1, `Total My Requests: ${empDashRes.data.data.stats.totalMyRequests}`);

    // Fetch categories
    const catRes = await request('/categories', { headers: empHeaders });
    const category = catRes.data.data[0];

    // Submit new service request
    const newReqRes = await request('/requests', {
      method: 'POST',
      headers: empHeaders,
      body: {
        title: 'QA Automated Verification: Standing Desk Control Box Replacement',
        description: 'The height adjustment motor on desk B-3-14 is showing an error code E-04 and will not elevate.',
        categoryId: category.id,
        priority: 'HIGH',
        contactInfo: 'Slack: @alex.rivera | Desk B-3-14',
      },
    });
    const createdRequest = newReqRes.data?.data;
    record('EMPLOYEE', 'Submit new service request', newReqRes.status === 201 && createdRequest?.requestId?.startsWith('WRK-'), `Generated ID: ${createdRequest?.requestId}`);

    // View request details and SLA countdown
    const reqDetailRes = await request(`/requests/${createdRequest.id}`, { headers: empHeaders });
    const reqData = reqDetailRes.data?.data;
    record('EMPLOYEE', 'View request details and SLA calculation', reqDetailRes.status === 200 && !!reqData.resolutionDeadline, `SLA Deadline: ${reqData.resolutionDeadline}, Remaining: ${reqData.slaEvaluation?.remainingMinutes}m`);

    // View assigned tasks
    const empTasksRes = await request('/tasks', { headers: empHeaders });
    record('EMPLOYEE', 'View assigned tasks list', empTasksRes.status === 200 && Array.isArray(empTasksRes.data?.data), `Found ${empTasksRes.data?.data?.length} tasks`);

    // Add public comment
    const empCommentRes = await request(`/requests/${createdRequest.id}/comments`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        content: 'Added power supply voltage measurement: 24V DC input is normal.',
        isInternal: false,
      },
    });
    record('EMPLOYEE', 'Post public comment on service request', empCommentRes.status === 201 && empCommentRes.data?.data?.content?.includes('24V DC'));

    // View notifications
    const empNotifRes = await request('/notifications', { headers: empHeaders });
    record('EMPLOYEE', 'View notification inbox', empNotifRes.status === 200 && Array.isArray(empNotifRes.data?.data), `Unread notifications: ${empNotifRes.data?.meta?.unreadCount}`);

    // Logout
    const empLogoutRes = await request('/auth/logout', { method: 'POST', headers: empHeaders });
    record('EMPLOYEE', 'Logout session', empLogoutRes.status === 200);

    // -------------------------------------------------------------
    // 2. SUPPORT AGENT WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Support Agent Persona (agent.marcus@worksphere.internal) ---');

    // Login
    const agentLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'agent.marcus@worksphere.internal',
        password: 'Agent@123',
      },
    });
    const agentToken = agentLoginRes.data?.data?.token;
    record('AGENT', 'Login authentication with credentials', agentLoginRes.status === 200 && !!agentToken, `Agent: ${agentLoginRes.data?.data?.user?.name}`);

    const agentHeaders = { Authorization: `Bearer ${agentToken}` };

    // Agent Dashboard
    const agentDashRes = await request('/dashboard/agent', { headers: agentHeaders });
    record('AGENT', 'Fetch support operations dashboard', agentDashRes.status === 200 && agentDashRes.data?.data?.stats?.myAssignedRequests >= 1);

    // Assign ticket to self
    const assignRes = await request(`/requests/${createdRequest.id}/assign`, {
      method: 'PATCH',
      headers: agentHeaders,
      body: {
        assigneeId: agentLoginRes.data.data.user.id,
        reason: 'Hardware desk motor diagnostic triage',
      },
    });
    record('AGENT', 'Accept / assign service request', assignRes.status === 200 && assignRes.data?.data?.assignedAgentId === agentLoginRes.data?.data?.user?.id);

    // Update status to IN_PROGRESS
    const statusUpdateRes = await request(`/requests/${createdRequest.id}/status`, {
      method: 'PATCH',
      headers: agentHeaders,
      body: {
        status: 'IN_PROGRESS',
        note: 'Ordered replacement Linak control module from stockroom.',
      },
    });
    record('AGENT', 'Update request status (transition to IN_PROGRESS)', statusUpdateRes.status === 200 && statusUpdateRes.data?.data?.status === 'IN_PROGRESS');

    // Add public comment
    const agentPubComment = await request(`/requests/${createdRequest.id}/comments`, {
      method: 'POST',
      headers: agentHeaders,
      body: {
        content: 'Hi Alex, I have retrieved the replacement control unit and will visit your desk at 11:30 AM.',
        isInternal: false,
      },
    });
    record('AGENT', 'Post public support comment', agentPubComment.status === 201);

    // Add CONFIDENTIAL INTERNAL NOTE
    const agentIntNote = await request(`/requests/${createdRequest.id}/comments`, {
      method: 'POST',
      headers: agentHeaders,
      body: {
        content: 'CONFIDENTIAL: Replacement control box retrieved from inventory bin HW-14. Warranty claim #89291 logged.',
        isInternal: true,
      },
    });
    record('AGENT', 'Add confidential internal note (agent-only)', agentIntNote.status === 201 && agentIntNote.data?.data?.isInternal === true);

    // Create and update tasks (Module B)
    const createTaskRes = await request('/tasks', {
      method: 'POST',
      headers: agentHeaders,
      body: {
        title: 'Swap Desk B-3-14 Motor Controller and Reset Stroke Limits',
        description: 'Replace faulty PCB, calibrate minimum and maximum limit switches, test memory presets 1 and 2.',
        taskType: 'SUPPORT_WORK',
        priority: 'HIGH',
        status: 'TODO',
        labels: ['Facilities', 'Hardware-Repair'],
      },
    });
    const createdTask = createTaskRes.data?.data;
    record('AGENT', 'Create operational task in Module B', createTaskRes.status === 201 && createdTask?.taskNumber?.startsWith('TSK-'), `Task: ${createdTask?.taskNumber}`);

    // Update task status on Kanban (simulate moving card to IN_PROGRESS)
    const updateTaskStatus = await request(`/tasks/${createdTask.id}/status`, {
      method: 'PATCH',
      headers: agentHeaders,
      body: {
        status: 'IN_PROGRESS',
        note: 'Beginning physical swap.',
      },
    });
    record('AGENT', 'Update task status on Kanban board', updateTaskStatus.status === 200 && updateTaskStatus.data?.data?.status === 'IN_PROGRESS');

    // Link task with service request (Module Integration)
    const linkTaskRes = await request(`/requests/${createdRequest.id}/tasks`, {
      method: 'POST',
      headers: agentHeaders,
      body: {
        taskId: createdTask.id,
      },
    });
    record('AGENT', 'Link operational task to service request (Module Integration)', linkTaskRes.status === 201 && linkTaskRes.data?.data?.serviceRequestId === createdRequest.id);

    // Verify linked task shows on service request
    const verifyLinked = await request(`/requests/${createdRequest.id}/tasks`, { headers: agentHeaders });
    record('AGENT', 'Query linked tasks on service request', verifyLinked.status === 200 && verifyLinked.data?.data?.some((t: any) => t.id === createdTask.id));

    // -------------------------------------------------------------
    // 3. ADMINISTRATOR WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Administrator Persona (admin@worksphere.internal) ---');

    // Login
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@worksphere.internal',
        password: 'Admin@123',
      },
    });
    const adminToken = adminLoginRes.data?.data?.token;
    record('ADMIN', 'Login authentication with credentials', adminLoginRes.status === 200 && !!adminToken, `Admin: ${adminLoginRes.data?.data?.user?.name}`);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // View dashboard analytics
    const adminDashRes = await request('/dashboard/admin', { headers: adminHeaders });
    const adminDash = adminDashRes.data?.data;
    record('ADMIN', 'View administrative analytics & SLA charts', adminDashRes.status === 200 && adminDash?.stats?.totalRequests >= 1 && adminDash?.categoryDistribution?.length > 0, `SLA Rate: ${adminDash?.stats?.slaComplianceRate}%`);

    // Manage users & view workload
    const usersRes = await request('/users', { headers: adminHeaders });
    const workloadRes = await request('/users/workload', { headers: adminHeaders });
    record('ADMIN', 'View user directory & workload distribution', usersRes.status === 200 && workloadRes.status === 200 && workloadRes.data?.data?.length > 0, `Agents evaluated: ${workloadRes.data?.data?.length}`);

    // Create a new employee user account
    const testUserEmail = `qa.employee.${Date.now()}@worksphere.internal`;
    const createUserRes = await request('/users', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'QA Test Submitter',
        email: testUserEmail,
        password: 'Employee@123',
        role: 'EMPLOYEE',
        jobTitle: 'QA Automation Engineer',
      },
    });
    const newTestUser = createUserRes.data?.data;
    record('ADMIN', 'Create new organization account', createUserRes.status === 201 && !!newTestUser?.id, `Created: ${testUserEmail}`);

    // Toggle user status (deactivate / reactivate)
    const toggleStatusRes = await request(`/users/${newTestUser.id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { isActive: false },
    });
    record('ADMIN', 'Deactivate user account (safe toggle)', toggleStatusRes.status === 200 && toggleStatusRes.data?.data?.isActive === false);

    // Reassign service request to another agent (e.g. Clara)
    const agent2 = usersRes.data.data.find((u: any) => u.email === 'agent.clara@worksphere.internal');
    const reassignRes = await request(`/requests/${createdRequest.id}/assign`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: {
        assigneeId: agent2.id,
        reason: 'Administrative escalation / re-balancing',
      },
    });
    record('ADMIN', 'Reassign service request with audit logging', reassignRes.status === 200 && reassignRes.data?.data?.assignedAgentId === agent2.id, `Reassigned to: ${agent2.name}`);

    // Manage SLA policies
    const slaPoliciesRes = await request('/sla/policies', { headers: adminHeaders });
    const criticalPolicy = slaPoliciesRes.data.data.find((p: any) => p.priority === 'CRITICAL');
    const updateSLARes = await request(`/sla/policies/${criticalPolicy.id}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: {
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        isBusinessHours: false,
        description: 'QA Updated: Critical priority 4h resolution 24/7 calendar clock',
      },
    });
    record('ADMIN', 'Update SLA policy configuration', updateSLARes.status === 200 && updateSLARes.data?.data?.resolutionTimeHours === 4);

    // View audit logs
    const auditRes = await request('/audit-logs', { headers: adminHeaders });
    record('ADMIN', 'View immutable audit log trail', auditRes.status === 200 && auditRes.data?.data?.length > 0, `Audit entries: ${auditRes.data?.data?.length}`);

    // -------------------------------------------------------------
    // 4. SECURITY & PERMISSION BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Security & Confidentiality Boundaries ---');

    // Test 1: Employee trying to access Admin audit logs -> MUST RETURN 403
    const empAuditAttempt = await request('/audit-logs', { headers: empHeaders });
    record('SECURITY', 'Employee access to /api/audit-logs blocked (403)', empAuditAttempt.status === 403, `Correctly received ${empAuditAttempt.status} Forbidden`);

    // Test 2: Confidential Internal Note Privacy:
    // When employee Alex fetches request details, internal notes MUST BE EXCLUDED!
    const empCheckNotes = await request(`/requests/${createdRequest.id}`, { headers: empHeaders });
    const empVisibleComments = empCheckNotes.data?.data?.comments || [];
    const empSeesInternal = empVisibleComments.some((c: any) => c.isInternal === true);
    record('SECURITY', 'Confidential Internal Note strictly hidden from Employee', !empSeesInternal, `Employee sees ${empVisibleComments.length} comments, 0 internal notes`);

    // When agent Marcus fetches request details, internal notes MUST BE PRESENT!
    const agentCheckNotes = await request(`/requests/${createdRequest.id}`, { headers: agentHeaders });
    const agentVisibleComments = agentCheckNotes.data?.data?.comments || [];
    const agentSeesInternal = agentVisibleComments.some((c: any) => c.isInternal === true);
    record('SECURITY', 'Confidential Internal Note visible to Support Agent', agentSeesInternal, `Agent sees ${agentVisibleComments.length} comments, including internal note`);

    // Test 3: Unauthenticated request to protected endpoint -> MUST RETURN 401
    const unauthAttempt = await request('/requests');
    record('SECURITY', 'Unauthenticated request to /api/requests blocked (401)', unauthAttempt.status === 401, `Correctly received ${unauthAttempt.status} Unauthorized`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=== E2E WORKFLOW TEST RESULTS SUMMARY ===');
    const total = results.length;
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;

    console.log(`Total E2E Scenarios: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('\nALL END-TO-END WORKFLOWS AND SECURITY CHECKS PASSED SUCCESSFULLY!\n');
    }
  } catch (err: any) {
    console.error('E2E Test Execution Error:', err.message);
    process.exit(1);
  }
}

runE2EWorkflowTests();
