export type Role = 'EMPLOYEE' | 'AGENT' | 'ADMIN';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_EMPLOYEE'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type NotificationType =
  | 'REQUEST_CREATED'
  | 'REQUEST_ASSIGNED'
  | 'REQUEST_STATUS_UPDATED'
  | 'REQUEST_COMMENT'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_COMMENT'
  | 'TASK_DEADLINE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'SLA_BREACH_WARNING'
  | 'SLA_BREACHED'
  | 'SYSTEM';

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: {
    users?: number;
    teams?: number;
    requests?: number;
    tasks?: number;
  };
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  department?: Department;
  description?: string;
  members?: {
    id: string;
    role: string;
    user: User;
  }[];
  _count?: {
    members?: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string | null;
  department?: Department | null;
  jobTitle?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RequestCategory {
  id: string;
  name: string;
  description?: string;
  defaultDepartmentId?: string | null;
  defaultDepartment?: Department | null;
  _count?: {
    serviceRequests?: number;
  };
}

export interface SLAPolicy {
  id: string;
  priority: RequestPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  isBusinessHours: boolean;
  description?: string;
}

export interface SLAEvaluation {
  isOverdue: boolean;
  remainingMinutes: number;
  slaStatus: 'MET' | 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  compliancePercentage: number;
}

export interface ServiceRequest {
  id: string;
  requestId: string;
  title: string;
  description: string;
  categoryId: string;
  category?: RequestCategory;
  subcategory?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  priority: RequestPriority;
  status: RequestStatus;
  contactInfo?: string | null;
  creatorId: string;
  creator: User;
  assignedAgentId?: string | null;
  assignedAgent?: User | null;
  responseDeadline?: string | null;
  resolutionDeadline?: string | null;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: RequestComment[];
  activities?: RequestActivity[];
  linkedTasks?: Task[];
  slaEvaluation?: SLAEvaluation;
  _count?: {
    comments?: number;
    linkedTasks?: number;
    attachments?: number;
  };
}

export interface RequestComment {
  id: string;
  requestId: string;
  authorId: string;
  author: User;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface RequestActivity {
  id: string;
  requestId: string;
  actorId: string;
  actor: { id: string; name: string; role: Role };
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description?: string | null;
  taskType: string;
  priority: TaskPriority;
  status: TaskStatus;
  departmentId?: string | null;
  department?: Department | null;
  creatorId: string;
  creator: User;
  assigneeId?: string | null;
  assignee?: User | null;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  labels: string[];
  serviceRequestId?: string | null;
  serviceRequest?: {
    id: string;
    requestId: string;
    title: string;
    status: RequestStatus;
    priority: RequestPriority;
  } | null;
  createdAt: string;
  updatedAt: string;
  comments?: TaskComment[];
  activities?: TaskActivity[];
  _count?: {
    comments?: number;
    attachments?: number;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  actorId: string;
  actor: { id: string; name: string; role: Role };
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actor?: { id: string; name: string; email: string; role: Role } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
}
