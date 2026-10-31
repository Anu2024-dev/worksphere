import { PrismaClient, Role, RequestPriority, RequestStatus, TaskPriority, TaskStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WorkSphere database...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.taskAssignmentHistory.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.requestAttachment.deleteMany();
  await prisma.requestAssignment.deleteMany();
  await prisma.requestActivity.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  await prisma.requestCategory.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Departments
  const itDept = await prisma.department.create({
    data: {
      name: 'Information Technology',
      description: 'IT infrastructure, systems administration, identity access, and user workstation hardware.',
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: 'Human Resources',
      description: 'Employee onboarding, benefits, workplace policies, and organizational development.',
    },
  });

  const facilitiesDept = await prisma.department.create({
    data: {
      name: 'Facilities & Workplace',
      description: 'Building maintenance, physical office access, furniture, utilities, and venue booking.',
    },
  });

  const engDept = await prisma.department.create({
    data: {
      name: 'Engineering',
      description: 'Software engineering, product development, platform operations, and QA.',
    },
  });

  const financeDept = await prisma.department.create({
    data: {
      name: 'Finance & Operations',
      description: 'Procurement, billing, corporate budgeting, and asset accounting.',
    },
  });

  // 3. Teams
  const itSupportTeam = await prisma.team.create({
    data: {
      name: 'Tier-2 IT Support Desk',
      departmentId: itDept.id,
      description: 'Handles day-to-day employee IT requests, system provisioning, and password resets.',
    },
  });

  const hrOperationsTeam = await prisma.team.create({
    data: {
      name: 'People Operations',
      departmentId: hrDept.id,
      description: 'Handles employee benefits, leave queries, and workspace accommodations.',
    },
  });

  const corePlatformTeam = await prisma.team.create({
    data: {
      name: 'Core Platform Engineering',
      departmentId: engDept.id,
      description: 'Manages enterprise microservices, database clusters, and internal developer tooling.',
    },
  });

  // 4. Users (Admin, Agents, Employees)
  const passwordSalt = 10;
  const adminPassword = await bcrypt.hash('Admin@123', passwordSalt);
  const agentPassword = await bcrypt.hash('Agent@123', passwordSalt);
  const employeePassword = await bcrypt.hash('Employee@123', passwordSalt);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@worksphere.internal',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      jobTitle: 'VP of Internal Operations',
      departmentId: itDept.id,
      phone: '+1 (555) 010-0001',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      name: 'Marcus Vance (IT Lead)',
      email: 'agent.marcus@worksphere.internal',
      passwordHash: agentPassword,
      role: Role.AGENT,
      jobTitle: 'Senior Systems Support Engineer',
      departmentId: itDept.id,
      phone: '+1 (555) 010-0002',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: 'Clara Oswald (Operations Agent)',
      email: 'agent.clara@worksphere.internal',
      passwordHash: agentPassword,
      role: Role.AGENT,
      jobTitle: 'HR & Facilities Coordinator',
      departmentId: hrDept.id,
      phone: '+1 (555) 010-0003',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Engineer)',
      email: 'employee.alex@worksphere.internal',
      passwordHash: employeePassword,
      role: Role.EMPLOYEE,
      jobTitle: 'Senior Full Stack Engineer',
      departmentId: engDept.id,
      phone: '+1 (555) 010-0004',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Marketing)',
      email: 'employee.elena@worksphere.internal',
      passwordHash: employeePassword,
      role: Role.EMPLOYEE,
      jobTitle: 'Marketing Campaign Lead',
      departmentId: financeDept.id,
      phone: '+1 (555) 010-0005',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'David Chen (Product Designer)',
      email: 'employee.david@worksphere.internal',
      passwordHash: employeePassword,
      role: Role.EMPLOYEE,
      jobTitle: 'Staff Product Designer',
      departmentId: engDept.id,
      phone: '+1 (555) 010-0006',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });

  // Assign Team Members
  await prisma.teamMember.createMany({
    data: [
      { teamId: itSupportTeam.id, userId: agent1.id, role: 'LEAD' },
      { teamId: itSupportTeam.id, userId: admin.id, role: 'MEMBER' },
      { teamId: hrOperationsTeam.id, userId: agent2.id, role: 'LEAD' },
      { teamId: corePlatformTeam.id, userId: employee1.id, role: 'MEMBER' },
      { teamId: corePlatformTeam.id, userId: employee3.id, role: 'MEMBER' },
    ],
  });

  // 5. SLA Policies (Standard & configurable)
  await prisma.sLAPolicy.createMany({
    data: [
      {
        priority: RequestPriority.CRITICAL,
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        isBusinessHours: false, // 24/7 calendar hours for critical issues
        description: 'Complete system outage, production blocker, or high-risk security vulnerability.',
      },
      {
        priority: RequestPriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
        isBusinessHours: false,
        description: 'Major impairment affecting department productivity or key client deliverables.',
      },
      {
        priority: RequestPriority.MEDIUM,
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        isBusinessHours: false,
        description: 'Standard technical request, hardware setup, software license, or permissions.',
      },
      {
        priority: RequestPriority.LOW,
        responseTimeHours: 8,
        resolutionTimeHours: 48,
        isBusinessHours: false,
        description: 'General informational inquiry, ergonomic assessment, or routine workspace request.',
      },
    ],
  });

  // 6. Request Categories
  const catIT = await prisma.requestCategory.create({
    data: {
      name: 'IT Support',
      description: 'Network issues, hardware replacement, VPN access, and email config.',
      defaultDepartmentId: itDept.id,
    },
  });

  const catHR = await prisma.requestCategory.create({
    data: {
      name: 'Human Resources',
      description: 'Benefits administration, payroll inquiries, and employee verification letters.',
      defaultDepartmentId: hrDept.id,
    },
  });

  const catFacilities = await prisma.requestCategory.create({
    data: {
      name: 'Facilities',
      description: 'Desk relocation, building security passes, climate control, and office supplies.',
      defaultDepartmentId: facilitiesDept.id,
    },
  });

  const catSoftwareHardware = await prisma.requestCategory.create({
    data: {
      name: 'Software and Hardware',
      description: 'Developer machine upgrades, monitor requisitions, and developer IDE tooling.',
      defaultDepartmentId: itDept.id,
    },
  });

  const catAccountAccess = await prisma.requestCategory.create({
    data: {
      name: 'Account and Access',
      description: 'Single sign-on permissions, AWS/GCP IAM roles, and repository access grants.',
      defaultDepartmentId: itDept.id,
    },
  });

  const catAdmin = await prisma.requestCategory.create({
    data: {
      name: 'General Administration',
      description: 'Travel booking authorizations, team expense approvals, and notary services.',
      defaultDepartmentId: financeDept.id,
    },
  });

  // Helper date calculations
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000);

  // 7. Service Requests with Lifecycle History & SLA Deadlines
  // Request 1: In Progress, assigned to Marcus Vance (IT), linked to Tasks
  const req1 = await prisma.serviceRequest.create({
    data: {
      requestId: 'WRK-2026-0001',
      title: 'Dual 4K Monitor Requisition and USB-C Dock Setup',
      description: 'Requesting two 27-inch 4K displays and an enterprise Thunderbolt docking station for multi-platform frontend and mobile simulator debugging.',
      categoryId: catSoftwareHardware.id,
      subcategory: 'Peripherals & Displays',
      departmentId: itDept.id,
      priority: RequestPriority.MEDIUM,
      status: RequestStatus.IN_PROGRESS,
      contactInfo: 'Slack: @alex.rivera | Desk: Building B, Level 3, Bay 14',
      creatorId: employee1.id,
      assignedAgentId: agent1.id,
      responseDeadline: hoursAgo(20), // responded
      resolutionDeadline: hoursFromNow(4), // in 4 hours
      firstRespondedAt: hoursAgo(22),
      createdAt: hoursAgo(24),
    },
  });

  await prisma.requestActivity.createMany({
    data: [
      {
        requestId: req1.id,
        actorId: employee1.id,
        action: 'CREATED',
        newValue: 'OPEN',
        note: 'Service request created by employee Alex Rivera.',
        createdAt: hoursAgo(24),
      },
      {
        requestId: req1.id,
        actorId: admin.id,
        action: 'ASSIGNED',
        field: 'assignedAgentId',
        oldValue: 'Unassigned',
        newValue: agent1.name,
        note: 'Assigned to IT specialist Marcus Vance based on hardware queue workload.',
        createdAt: hoursAgo(23),
      },
      {
        requestId: req1.id,
        actorId: agent1.id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'OPEN',
        newValue: 'IN_PROGRESS',
        note: 'Marcus Vance marked request as In Progress after verifying warehouse inventory.',
        createdAt: hoursAgo(22),
      },
    ],
  });

  await prisma.requestComment.createMany({
    data: [
      {
        requestId: req1.id,
        authorId: agent1.id,
        content: 'Hi Alex, I have located two Dell U2723QE displays in our hardware room. I am creating setup tasks to test cables and deploy them to your desk.',
        isInternal: false,
        createdAt: hoursAgo(21),
      },
      {
        requestId: req1.id,
        authorId: agent1.id,
        content: 'INTERNAL NOTE: Requisition approved under Engineering Q4 hardware budget allowance ($1,400 cap). Asset tags: AST-8841 and AST-8842.',
        isInternal: true, // Strictly hidden from employees
        createdAt: hoursAgo(21),
      },
      {
        requestId: req1.id,
        authorId: employee1.id,
        content: 'Awesome, thanks Marcus! I will be at my desk after 2 PM for the desk drop-off.',
        isInternal: false,
        createdAt: hoursAgo(18),
      },
    ],
  });

  // Request 2: CRITICAL - Server Room HVAC Warning (OPEN, Unassigned, SLA at risk)
  const req2 = await prisma.serviceRequest.create({
    data: {
      requestId: 'WRK-2026-0002',
      title: 'CRITICAL: Secondary Server Room Ambient Temp Exceeded 28°C',
      description: 'Sensor alert telemetry in MDF Server Room 2 indicating high temperature threshold breach. AC unit fan motor vibrating abnormally.',
      categoryId: catFacilities.id,
      subcategory: 'HVAC & Power',
      departmentId: facilitiesDept.id,
      priority: RequestPriority.CRITICAL,
      status: RequestStatus.OPEN,
      contactInfo: 'Emergency Facilities Hotwire: ext 9911',
      creatorId: employee1.id,
      assignedAgentId: null, // Unassigned
      responseDeadline: hoursFromNow(1),
      resolutionDeadline: hoursFromNow(3),
      createdAt: hoursAgo(0.5),
    },
  });

  await prisma.requestActivity.create({
    data: {
      requestId: req2.id,
      actorId: employee1.id,
      action: 'CREATED',
      newValue: 'OPEN',
      note: 'Critical facilities request flagged with immediate SLA tracking.',
      createdAt: hoursAgo(0.5),
    },
  });

  // Request 3: RESOLVED - Production VPN Access Grant for Elena
  const req3 = await prisma.serviceRequest.create({
    data: {
      requestId: 'WRK-2026-0003',
      title: 'Okta SSO & GlobalProtect VPN Access for Marketing Analytics Portal',
      description: 'Require elevated SSO role to view customer telemetry metrics in Superset and Looker dashboards for Q4 product launch campaign.',
      categoryId: catAccountAccess.id,
      subcategory: 'IAM & SSO Roles',
      departmentId: itDept.id,
      priority: RequestPriority.HIGH,
      status: RequestStatus.RESOLVED,
      contactInfo: 'Slack: @elena.rostova',
      creatorId: employee2.id,
      assignedAgentId: agent1.id,
      responseDeadline: hoursAgo(26),
      resolutionDeadline: hoursAgo(20),
      firstRespondedAt: hoursAgo(27),
      resolvedAt: hoursAgo(6),
      createdAt: hoursAgo(28),
    },
  });

  await prisma.requestActivity.createMany({
    data: [
      {
        requestId: req3.id,
        actorId: employee2.id,
        action: 'CREATED',
        newValue: 'OPEN',
        createdAt: hoursAgo(28),
      },
      {
        requestId: req3.id,
        actorId: admin.id,
        action: 'ASSIGNED',
        newValue: agent1.name,
        createdAt: hoursAgo(27.5),
      },
      {
        requestId: req3.id,
        actorId: agent1.id,
        action: 'RESOLVED',
        oldValue: 'IN_PROGRESS',
        newValue: 'RESOLVED',
        note: 'Assigned Looker Viewer & Marketing Datagroup security role in Okta. Verified SSO handshake.',
        createdAt: hoursAgo(6),
      },
    ],
  });

  await prisma.requestComment.create({
    data: {
      requestId: req3.id,
      authorId: agent1.id,
      content: 'Access granted and synced with Okta group `grp-marketing-analytics`. Please relog into Okta dashboard to refresh your session tokens.',
      isInternal: false,
      createdAt: hoursAgo(6),
    },
  });

  // Request 4: WAITING_FOR_EMPLOYEE - HR Verification Letter
  const req4 = await prisma.serviceRequest.create({
    data: {
      requestId: 'WRK-2026-0004',
      title: 'Employment Verification Letter for Visa Application',
      description: 'Need a stamped and signed proof of employment letter with compensation breakdown for consulate visa interview.',
      categoryId: catHR.id,
      subcategory: 'Immigration & Verification',
      departmentId: hrDept.id,
      priority: RequestPriority.LOW,
      status: RequestStatus.WAITING_FOR_EMPLOYEE,
      contactInfo: 'Email: employee.david@worksphere.internal',
      creatorId: employee3.id,
      assignedAgentId: agent2.id,
      responseDeadline: hoursAgo(10),
      resolutionDeadline: hoursFromNow(24),
      firstRespondedAt: hoursAgo(12),
      createdAt: hoursAgo(16),
    },
  });

  await prisma.requestComment.create({
    data: {
      requestId: req4.id,
      authorId: agent2.id,
      content: 'Hi David, please reply with the exact consular address and official visa applicant reference code so we can format the header correctly.',
      isInternal: false,
      createdAt: hoursAgo(12),
    },
  });

  // 8. Tasks (Module B - Task Management System)
  // Demonstrating both independent tasks AND linked tasks connected to Service Requests!
  
  // Task 1 (Linked to req1): Hardware Delivery and Cable Routing
  const task1 = await prisma.task.create({
    data: {
      taskNumber: 'TSK-1001',
      title: 'Deploy Dell 4K Displays and Calibrate Cable Management at Desk B-3-14',
      description: 'Deliver the two 27-inch displays from hardware room, mount to VESA gas-spring dual arms, and hook up DisplayPort to USB-C dock.',
      taskType: 'SUPPORT_WORK',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      departmentId: itDept.id,
      creatorId: agent1.id,
      assigneeId: agent1.id,
      startDate: hoursAgo(4),
      dueDate: hoursFromNow(2),
      estimatedHours: 2.0,
      labels: ['Hardware', 'Field-Support', 'Requisition'],
      serviceRequestId: req1.id, // Explicit linking to Request WRK-2026-0001
      createdAt: hoursAgo(20),
    },
  });

  // Task 2 (Linked to req1): Asset Tagging and Inventory Barcode Registration
  const task2 = await prisma.task.create({
    data: {
      taskNumber: 'TSK-1002',
      title: 'Scan and Log Asset Barcodes in Snipe-IT Fixed Asset Register',
      description: 'Record serial numbers for monitors AST-8841 and AST-8842 and register custodian as Alex Rivera.',
      taskType: 'SUPPORT_WORK',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      departmentId: itDept.id,
      creatorId: agent1.id,
      assigneeId: agent1.id,
      startDate: hoursAgo(18),
      dueDate: hoursAgo(10),
      estimatedHours: 0.5,
      labels: ['Compliance', 'Fixed-Assets'],
      serviceRequestId: req1.id, // Explicit linking to Request WRK-2026-0001
      createdAt: hoursAgo(20),
    },
  });

  // Task 3: Independent engineering task - Migrate Auth to OAuth2 PKCE
  const task3 = await prisma.task.create({
    data: {
      taskNumber: 'TSK-1003',
      title: 'Upgrade Mobile OAuth2 Client Flow with Proof Key for Code Exchange (PKCE)',
      description: 'Audit mobile authentication token exchange endpoint and enforce RFC 7636 PKCE verification to eliminate authorization code interception.',
      taskType: 'FEATURE',
      priority: TaskPriority.URGENT,
      status: TaskStatus.IN_REVIEW,
      departmentId: engDept.id,
      creatorId: admin.id,
      assigneeId: employee1.id,
      startDate: hoursAgo(72),
      dueDate: hoursFromNow(12),
      estimatedHours: 16.0,
      labels: ['Security', 'Auth', 'Mobile', 'Backend'],
      createdAt: hoursAgo(72),
    },
  });

  // Task 4: Independent task - Design System Audit and WCAG 2.1 AA Contrast Check
  const task4 = await prisma.task.create({
    data: {
      taskNumber: 'TSK-1004',
      title: 'Conduct WCAG 2.1 AA Accessibility & Color Contrast Audit on Component Tokens',
      description: 'Inspect button states, badge contrasts, and focus rings across light and dark theme tokens in Figma and Tailwind preset.',
      taskType: 'INVESTIGATION',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      departmentId: engDept.id,
      creatorId: admin.id,
      assigneeId: employee3.id,
      startDate: hoursFromNow(24),
      dueDate: hoursFromNow(96),
      estimatedHours: 8.0,
      labels: ['UI/UX', 'Design-System', 'A11y'],
      createdAt: hoursAgo(12),
    },
  });

  // Task 5: Facilities Task - HVAC Servicing Emergency Dispatch
  const task5 = await prisma.task.create({
    data: {
      taskNumber: 'TSK-1005',
      title: 'Dispatch Certified Chiller Technician for Server Room 2 Secondary Cooling',
      description: 'Contact Carrier commercial HVAC emergency support hotline to repair fan bearing and recharge refrigerant line in MDF 2.',
      taskType: 'SUPPORT_WORK',
      priority: TaskPriority.URGENT,
      status: TaskStatus.BLOCKED,
      departmentId: facilitiesDept.id,
      creatorId: admin.id,
      assigneeId: agent2.id,
      startDate: hoursAgo(1),
      dueDate: hoursFromNow(2),
      estimatedHours: 4.0,
      labels: ['Emergency', 'Facilities', 'Vendor-Dispatched'],
      serviceRequestId: req2.id, // Explicit linking to Request WRK-2026-0002
      createdAt: hoursAgo(1),
    },
  });

  // Task comments and activity
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task1.id,
        authorId: agent1.id,
        content: 'VESA brackets attached. Rolling out cart to Building B now.',
        createdAt: hoursAgo(1),
      },
      {
        taskId: task3.id,
        authorId: employee1.id,
        content: 'PR #418 opened on GitHub with 100% unit test coverage for PKCE code challenge generation and sha256 verification.',
        createdAt: hoursAgo(4),
      },
      {
        taskId: task5.id,
        authorId: agent2.id,
        content: 'BLOCKED: Waiting for Carrier technician gate pass security clearance at visitor gate 3.',
        createdAt: hoursAgo(0.3),
      },
    ],
  });

  await prisma.taskActivity.createMany({
    data: [
      {
        taskId: task1.id,
        actorId: agent1.id,
        action: 'CREATED',
        note: 'Task created and linked to Service Request WRK-2026-0001.',
        createdAt: hoursAgo(20),
      },
      {
        taskId: task1.id,
        actorId: agent1.id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS',
        note: 'Commenced workstation setup.',
        createdAt: hoursAgo(4),
      },
      {
        taskId: task2.id,
        actorId: agent1.id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'IN_PROGRESS',
        newValue: 'COMPLETED',
        note: 'Fixed assets tagged and recorded in system.',
        createdAt: hoursAgo(10),
      },
    ],
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee1.id,
        title: 'Service Request In Progress',
        message: 'Your service request WRK-2026-0001 (Dual 4K Monitor Requisition) is now In Progress with Marcus Vance.',
        type: NotificationType.REQUEST_STATUS_UPDATED,
        link: '/requests/WRK-2026-0001',
        isRead: false,
        createdAt: hoursAgo(22),
      },
      {
        userId: employee1.id,
        title: 'New Task Assigned to You',
        message: 'Sarah Jenkins assigned you task TSK-1003: Upgrade Mobile OAuth2 Client Flow with PKCE.',
        type: NotificationType.TASK_ASSIGNED,
        link: '/tasks/TSK-1003',
        isRead: false,
        createdAt: hoursAgo(72),
      },
      {
        userId: agent1.id,
        title: 'New Request Assignment',
        message: 'You have been assigned to service request WRK-2026-0001.',
        type: NotificationType.REQUEST_ASSIGNED,
        link: '/requests/WRK-2026-0001',
        isRead: true,
        createdAt: hoursAgo(23),
      },
      {
        userId: admin.id,
        title: 'CRITICAL SLA Warning Alert',
        message: 'Service request WRK-2026-0002 has priority CRITICAL and is currently unassigned! SLA response deadline in 1 hour.',
        type: NotificationType.SLA_BREACH_WARNING,
        link: '/requests/WRK-2026-0002',
        isRead: false,
        createdAt: hoursAgo(0.5),
      },
      {
        userId: employee2.id,
        title: 'Request Resolved',
        message: 'Your request WRK-2026-0003 (Okta SSO & VPN Access) has been resolved.',
        type: NotificationType.REQUEST_STATUS_UPDATED,
        link: '/requests/WRK-2026-0003',
        isRead: true,
        createdAt: hoursAgo(6),
      },
    ],
  });

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'SYSTEM',
        details: { message: 'Initialized WorkSphere enterprise platform with departments, teams, and SLA defaults' },
        createdAt: hoursAgo(72),
      },
      {
        actorId: admin.id,
        action: 'REQUEST_ASSIGNED',
        entityType: 'REQUEST',
        entityId: req1.id,
        details: { assignedTo: agent1.name, reason: 'Hardware workload assignment' },
        createdAt: hoursAgo(23),
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Demo Credentials:');
  console.log('Admin:    admin@worksphere.internal / Admin@123');
  console.log('Agent 1:  agent.marcus@worksphere.internal / Agent@123');
  console.log('Agent 2:  agent.clara@worksphere.internal / Agent@123');
  console.log('Employee: employee.alex@worksphere.internal / Employee@123');
  console.log('Employee: employee.elena@worksphere.internal / Employee@123');
  console.log('Employee: employee.david@worksphere.internal / Employee@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
