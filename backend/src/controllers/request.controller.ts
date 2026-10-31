import { Response, NextFunction } from 'express';
import { RequestStatus, RequestPriority, Role, NotificationType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { generateRequestId, generateTaskNumber } from '../utils/idGenerator.js';
import { calculateSLADeadlines, evaluateSLA } from '../utils/slaCalculator.js';
import {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
  assignRequestSchema,
  addRequestCommentSchema,
} from '../validators/request.validator.js';

// Valid status transitions map
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  OPEN: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.CLOSED],
  ASSIGNED: [RequestStatus.IN_PROGRESS, RequestStatus.WAITING_FOR_EMPLOYEE, RequestStatus.CLOSED],
  IN_PROGRESS: [RequestStatus.WAITING_FOR_EMPLOYEE, RequestStatus.RESOLVED, RequestStatus.CLOSED],
  WAITING_FOR_EMPLOYEE: [RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.CLOSED],
  RESOLVED: [RequestStatus.CLOSED, RequestStatus.REOPENED],
  CLOSED: [RequestStatus.REOPENED],
  REOPENED: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.CLOSED],
};

export async function listRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const {
      status,
      priority,
      categoryId,
      departmentId,
      assignedAgentId,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Strict Role-Based Access Scoping:
    if (user.role === Role.EMPLOYEE) {
      where.creatorId = user.id; // Employees can ONLY see their own requests!
    } else if (user.role === Role.AGENT) {
      // Agents can see requests assigned to them, or unassigned requests in their department, or all if filtering
      if (assignedAgentId) {
        where.assignedAgentId = assignedAgentId as string;
      }
    } else if (user.role === Role.ADMIN) {
      if (assignedAgentId) {
        where.assignedAgentId = assignedAgentId as string;
      }
    }

    if (status) where.status = status as RequestStatus;
    if (priority) where.priority = priority as RequestPriority;
    if (categoryId) where.categoryId = categoryId as string;
    if (departmentId) where.departmentId = departmentId as string;

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { requestId: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignedAgent: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: {
            select: {
              comments: true,
              linkedTasks: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    // Enhance records with dynamic SLA metrics
    const enhancedRequests = requests.map((req) => {
      const sla = evaluateSLA(req.resolutionDeadline, req.resolvedAt, req.createdAt);
      return {
        ...req,
        slaEvaluation: sla,
      };
    });

    res.status(200).json({
      success: true,
      data: enhancedRequests,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id }, { requestId: id }],
      },
      include: {
        category: true,
        department: true,
        creator: {
          select: { id: true, name: true, email: true, phone: true, jobTitle: true, avatarUrl: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true, phone: true, jobTitle: true, avatarUrl: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          include: {
            actor: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            assigner: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        linkedTasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Service request not found.' });
      return;
    }

    // Backend-enforced authorization: Employee cannot view someone else's request!
    if (user.role === Role.EMPLOYEE && request.creatorId !== user.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this service request.',
      });
      return;
    }

    // Backend-enforced confidentiality: Internal notes must NEVER be visible to employees!
    let visibleComments = request.comments;
    if (user.role === Role.EMPLOYEE) {
      visibleComments = request.comments.filter((c) => !c.isInternal);
    }

    const slaEvaluation = evaluateSLA(request.resolutionDeadline, request.resolvedAt, request.createdAt);

    res.status(200).json({
      success: true,
      data: {
        ...request,
        comments: visibleComments,
        slaEvaluation,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = createRequestSchema.parse(req.body);

    // Concurrency-safe unique Request ID (WRK-2026-XXXX)
    const requestId = await generateRequestId();

    // Calculate SLA response and resolution deadlines from policy
    const sla = await calculateSLADeadlines(data.priority);

    // Use transaction to create request and initial activity log
    const newRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.create({
        data: {
          requestId,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          subcategory: data.subcategory,
          departmentId: data.departmentId,
          priority: data.priority,
          status: RequestStatus.OPEN,
          contactInfo: data.contactInfo,
          creatorId: user.id,
          responseDeadline: sla.responseDeadline,
          resolutionDeadline: sla.resolutionDeadline,
        },
        include: {
          category: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await tx.requestActivity.create({
        data: {
          requestId: request.id,
          actorId: user.id,
          action: 'CREATED',
          newValue: 'OPEN',
          note: `Service request submitted by ${user.name}.`,
        },
      });

      return request;
    });

    // Notify admins of new service request
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'New Service Request Created',
        message: `${newRequest.requestId}: ${newRequest.title} [${newRequest.priority}]`,
        type: NotificationType.REQUEST_CREATED,
        link: `/requests/${newRequest.requestId}`,
      })),
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully.',
      data: newRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = updateRequestSchema.parse(req.body);

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (user.role === Role.EMPLOYEE && existing.creatorId !== user.id) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Request updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRequestStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, note } = updateRequestStatusSchema.parse(req.body);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { creator: true, assignedAgent: true },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Employees cannot change status freely unless confirming closure or reopening
    if (user.role === Role.EMPLOYEE) {
      if (request.creatorId !== user.id) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      if (status !== RequestStatus.CLOSED && status !== RequestStatus.REOPENED) {
        res.status(403).json({
          success: false,
          message: 'Employees may only confirm resolution (close) or reopen a request.',
        });
        return;
      }
    }

    // Validate status transition
    const allowedNextStatuses = VALID_TRANSITIONS[request.status];
    if (!allowedNextStatuses || !allowedNextStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from '${request.status}' to '${status}'. Allowed transitions: ${allowedNextStatuses.join(', ')}`,
      });
      return;
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === RequestStatus.RESOLVED && !request.resolvedAt) {
      updateData.resolvedAt = now;
    }
    if (status === RequestStatus.CLOSED && !request.closedAt) {
      updateData.closedAt = now;
    }
    if (status === RequestStatus.REOPENED) {
      updateData.reopenedAt = now;
    }
    if (status === RequestStatus.IN_PROGRESS && !request.firstRespondedAt) {
      updateData.firstRespondedAt = now;
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: updateData,
      });

      await tx.requestActivity.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: 'STATUS_CHANGED',
          field: 'status',
          oldValue: request.status,
          newValue: status,
          note: note || `Status transitioned to ${status} by ${user.name}`,
        },
      });

      return updated;
    });

    // Notify employee of status update
    if (user.id !== request.creatorId) {
      await prisma.notification.create({
        data: {
          userId: request.creatorId,
          title: `Request ${request.requestId} Status Updated`,
          message: `Your request status is now '${status}'.`,
          type: NotificationType.REQUEST_STATUS_UPDATED,
          link: `/requests/${request.requestId}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}.`,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { assigneeId, reason } = assignRequestSchema.parse(req.body);

    // Only AGENT or ADMIN can assign requests
    if (user.role === Role.EMPLOYEE) {
      res.status(403).json({ success: false, message: 'Forbidden. Employees cannot assign requests.' });
      return;
    }

    // Verify assignee exists and is an AGENT or ADMIN
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!assignee || !assignee.isActive || assignee.role === Role.EMPLOYEE) {
      res.status(400).json({
        success: false,
        message: 'Assignee must be an active support agent or administrator.',
      });
      return;
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { assignedAgent: true },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Service request not found.' });
      return;
    }

    const previousAgentName = request.assignedAgent ? request.assignedAgent.name : 'Unassigned';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the request
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: {
          assignedAgentId: assigneeId,
          status: request.status === RequestStatus.OPEN ? RequestStatus.ASSIGNED : request.status,
        },
      });

      // 2. Create RequestAssignment history record
      await tx.requestAssignment.create({
        data: {
          requestId: id,
          assignerId: user.id,
          assigneeId,
          previousAssigneeId: request.assignedAgentId,
          reason,
        },
      });

      // 3. Create RequestActivity audit record
      await tx.requestActivity.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: 'ASSIGNED',
          field: 'assignedAgentId',
          oldValue: previousAgentName,
          newValue: assignee.name,
          note: reason || `Assigned to ${assignee.name} by ${user.name}.`,
        },
      });

      return updated;
    });

    // Notify newly assigned agent
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        title: 'New Service Request Assigned',
        message: `You have been assigned to ${request.requestId}: ${request.title}`,
        type: NotificationType.REQUEST_ASSIGNED,
        link: `/requests/${request.requestId}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Request successfully assigned to ${assignee.name}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addRequestComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { content, isInternal } = addRequestCommentSchema.parse(req.body);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { creator: true, assignedAgent: true },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found.' });
      return;
    }

    // Role check: Employee cannot post internal notes!
    let sanitizedIsInternal = isInternal;
    if (user.role === Role.EMPLOYEE) {
      if (request.creatorId !== user.id) {
        res.status(403).json({ success: false, message: 'Forbidden.' });
        return;
      }
      sanitizedIsInternal = false; // Strictly enforce public comment for employees
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.requestComment.create({
        data: {
          requestId: id,
          authorId: user.id,
          content,
          isInternal: sanitizedIsInternal,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true, avatarUrl: true },
          },
        },
      });

      await tx.requestActivity.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: sanitizedIsInternal ? 'INTERNAL_NOTE_ADDED' : 'COMMENT_ADDED',
          note: sanitizedIsInternal
            ? `Internal note added by ${user.name}.`
            : `Public comment added by ${user.name}.`,
        },
      });

      return newComment;
    });

    // Notifications (only if comment is public, notify creator; if internal, notify agent/admin only)
    if (!sanitizedIsInternal && user.id !== request.creatorId) {
      await prisma.notification.create({
        data: {
          userId: request.creatorId,
          title: `New Comment on ${request.requestId}`,
          message: `${user.name} commented on your request.`,
          type: NotificationType.REQUEST_COMMENT,
          link: `/requests/${request.requestId}`,
        },
      });
    } else if (user.id === request.creatorId && request.assignedAgentId) {
      await prisma.notification.create({
        data: {
          userId: request.assignedAgentId,
          title: `Employee Replied to ${request.requestId}`,
          message: `${user.name} posted a comment on ${request.requestId}.`,
          type: NotificationType.REQUEST_COMMENT,
          link: `/requests/${request.requestId}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: sanitizedIsInternal ? 'Internal note added.' : 'Comment posted successfully.',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

export async function reopenRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found.' });
      return;
    }

    if (request.status !== RequestStatus.RESOLVED && request.status !== RequestStatus.CLOSED) {
      res.status(400).json({
        success: false,
        message: 'Only resolved or closed requests can be reopened.',
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resReq = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: RequestStatus.REOPENED,
          reopenedAt: new Date(),
        },
      });

      await tx.requestActivity.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: 'REOPENED',
          oldValue: request.status,
          newValue: 'REOPENED',
          note: reason || `Request reopened by ${user.name}.`,
        },
      });

      return resReq;
    });

    res.status(200).json({
      success: true,
      message: 'Request reopened successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// Module Integration: Linked Tasks for a Service Request
export async function getLinkedTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const tasks = await prisma.task.findMany({
      where: { serviceRequestId: id },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function linkTaskToRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params; // Request ID
    const { taskId, title, description, priority, assigneeId, dueDate, labels } = req.body;

    // Check request exists
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ success: false, message: 'Service request not found.' });
      return;
    }

    let linkedTask;

    if (taskId) {
      // Linking an existing task
      linkedTask = await prisma.$transaction(async (tx) => {
        const t = await tx.task.update({
          where: { id: taskId },
          data: { serviceRequestId: id },
        });

        await tx.requestActivity.create({
          data: {
            requestId: id,
            actorId: user.id,
            action: 'TASK_LINKED',
            note: `Linked existing task ${t.taskNumber} to this request.`,
          },
        });

        await tx.taskActivity.create({
          data: {
            taskId: t.id,
            actorId: user.id,
            action: 'LINKED_TO_REQUEST',
            note: `Task linked to service request ${request.requestId}.`,
          },
        });

        return t;
      });
    } else {
      // Creating a brand new task linked directly to this request
      const taskNumber = await generateTaskNumber();

      linkedTask = await prisma.$transaction(async (tx) => {
        const newTask = await tx.task.create({
          data: {
            taskNumber,
            title: title || `Task for ${request.requestId}`,
            description,
            taskType: 'SUPPORT_WORK',
            priority: priority || 'MEDIUM',
            departmentId: request.departmentId,
            creatorId: user.id,
            assigneeId: assigneeId || user.id,
            dueDate: dueDate ? new Date(dueDate) : null,
            labels: labels || ['Service-Desk'],
            serviceRequestId: id,
          },
        });

        await tx.requestActivity.create({
          data: {
            requestId: id,
            actorId: user.id,
            action: 'TASK_LINKED',
            note: `Created and linked task ${newTask.taskNumber} (${newTask.title}) to this request.`,
          },
        });

        await tx.taskActivity.create({
          data: {
            taskId: newTask.id,
            actorId: user.id,
            action: 'CREATED',
            note: `Task created from service request ${request.requestId}.`,
          },
        });

        return newTask;
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task linked to service request successfully.',
      data: linkedTask,
    });
  } catch (error) {
    next(error);
  }
}

export async function unlinkTaskFromRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { requestId, taskId } = req.params;

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { serviceRequestId: null },
      });

      await tx.requestActivity.create({
        data: {
          requestId,
          actorId: user.id,
          action: 'TASK_UNLINKED',
          note: `Unlinked task from this service request.`,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Task unlinked successfully.',
    });
  } catch (error) {
    next(error);
  }
}
