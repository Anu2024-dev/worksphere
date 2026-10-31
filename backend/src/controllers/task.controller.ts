import { Response, NextFunction } from 'express';
import { TaskStatus, TaskPriority, Role, NotificationType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { generateTaskNumber } from '../utils/idGenerator.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  addTaskCommentSchema,
} from '../validators/task.validator.js';

export async function listTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const {
      status,
      priority,
      departmentId,
      assigneeId,
      creatorId,
      serviceRequestId,
      search,
      isOverdue,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) where.status = status as TaskStatus;
    if (priority) where.priority = priority as TaskPriority;
    if (departmentId) where.departmentId = departmentId as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (creatorId) where.creatorId = creatorId as string;
    if (serviceRequestId) where.serviceRequestId = serviceRequestId as string;

    if (isOverdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { taskNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { labels: { has: q } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          serviceRequest: {
            select: { id: true, requestId: true, title: true, status: true, priority: true },
          },
          _count: {
            select: {
              comments: true,
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
      prisma.task.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
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

export async function getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ id }, { taskNumber: id }],
      },
      include: {
        department: true,
        creator: {
          select: { id: true, name: true, email: true, phone: true, jobTitle: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, phone: true, jobTitle: true, avatarUrl: true },
        },
        serviceRequest: {
          select: {
            id: true,
            requestId: true,
            title: true,
            status: true,
            priority: true,
            assignedAgent: { select: { id: true, name: true } },
          },
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
        assignmentHistory: {
          include: {
            assigner: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const data = createTaskSchema.parse(req.body);

    const taskNumber = await generateTaskNumber();

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          taskNumber,
          title: data.title,
          description: data.description,
          taskType: data.taskType,
          priority: data.priority,
          status: data.status,
          departmentId: data.departmentId,
          creatorId: user.id,
          assigneeId: data.assigneeId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours,
          labels: data.labels,
          serviceRequestId: data.serviceRequestId,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      await tx.taskActivity.create({
        data: {
          taskId: newTask.id,
          actorId: user.id,
          action: 'CREATED',
          note: `Task created by ${user.name}.`,
        },
      });

      if (data.assigneeId) {
        await tx.taskAssignmentHistory.create({
          data: {
            taskId: newTask.id,
            assignerId: user.id,
            assigneeId: data.assigneeId,
          },
        });
      }

      return newTask;
    });

    // Notify assignee if assigned to someone else
    if (data.assigneeId && data.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          title: 'New Task Assigned',
          message: `${user.name} assigned you task ${task.taskNumber}: ${task.title}`,
          type: NotificationType.TASK_ASSIGNED,
          link: `/tasks/${task.taskNumber}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const updatePayload: any = { ...data };
    if (data.startDate) updatePayload.startDate = new Date(data.startDate);
    if (data.dueDate) updatePayload.dueDate = new Date(data.dueDate);

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id },
        data: updatePayload,
      });

      await tx.taskActivity.create({
        data: {
          taskId: id,
          actorId: user.id,
          action: 'UPDATED',
          note: `Task details modified by ${user.name}.`,
        },
      });

      return t;
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, note } = updateTaskStatusSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, creator: true },
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { status },
      });

      await tx.taskActivity.create({
        data: {
          taskId: id,
          actorId: user.id,
          action: 'STATUS_CHANGED',
          field: 'status',
          oldValue: task.status,
          newValue: status,
          note: note || `Status transitioned to ${status} by ${user.name}`,
        },
      });

      return updated;
    });

    // Notify task creator or assignee if updated by someone else
    const targetUserId = user.id === task.assigneeId ? task.creatorId : task.assigneeId;
    if (targetUserId && targetUserId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: `Task ${task.taskNumber} Status: ${status}`,
          message: `${user.name} changed status of '${task.title}' to ${status}.`,
          type: NotificationType.TASK_STATUS_UPDATED,
          link: `/tasks/${task.taskNumber}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}.`,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { assigneeId, reason } = assignTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true },
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    let assigneeName = 'Unassigned';
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, name: true, isActive: true },
      });

      if (!assignee || !assignee.isActive) {
        res.status(400).json({ success: false, message: 'Assignee is not a valid active user.' });
        return;
      }
      assigneeName = assignee.name;
    }

    const previousName = task.assignee ? task.assignee.name : 'Unassigned';

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { assigneeId },
      });

      if (assigneeId) {
        await tx.taskAssignmentHistory.create({
          data: {
            taskId: id,
            assignerId: user.id,
            assigneeId,
            previousAssigneeId: task.assigneeId,
          },
        });
      }

      await tx.taskActivity.create({
        data: {
          taskId: id,
          actorId: user.id,
          action: 'ASSIGNED',
          field: 'assigneeId',
          oldValue: previousName,
          newValue: assigneeName,
          note: reason || `Assigned to ${assigneeName} by ${user.name}.`,
        },
      });

      return updated;
    });

    if (assigneeId && assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Task Assigned',
          message: `${user.name} assigned you task ${task.taskNumber}: ${task.title}`,
          type: NotificationType.TASK_ASSIGNED,
          link: `/tasks/${task.taskNumber}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Task successfully assigned to ${assigneeName}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addTaskComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { content } = addTaskCommentSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, creator: true },
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.taskComment.create({
        data: {
          taskId: id,
          authorId: user.id,
          content,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true, avatarUrl: true },
          },
        },
      });

      await tx.taskActivity.create({
        data: {
          taskId: id,
          actorId: user.id,
          action: 'COMMENT_ADDED',
          note: `${user.name} posted a comment.`,
        },
      });

      return c;
    });

    // Notify counterpart
    const targetUserId = user.id === task.assigneeId ? task.creatorId : task.assigneeId;
    if (targetUserId && targetUserId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: `New Comment on Task ${task.taskNumber}`,
          message: `${user.name}: "${content.substring(0, 60)}..."`,
          type: NotificationType.TASK_COMMENT,
          link: `/tasks/${task.taskNumber}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { commentId } = req.params;

    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found.' });
      return;
    }

    // Only comment author or ADMIN can delete comment
    if (comment.authorId !== user.id && user.role !== Role.ADMIN) {
      res.status(403).json({ success: false, message: 'Forbidden. You can only delete your own comments.' });
      return;
    }

    await prisma.taskComment.delete({ where: { id: commentId } });

    res.status(200).json({
      success: true,
      message: 'Comment deleted.',
    });
  } catch (error) {
    next(error);
  }
}
