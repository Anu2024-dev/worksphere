import { Response, NextFunction } from 'express';
import { RequestStatus, TaskStatus, Role, RequestPriority, TaskPriority } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function getEmployeeDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const now = new Date();

    const [
      totalMyRequests,
      openRequests,
      inProgressRequests,
      resolvedRequests,
      myAssignedTasks,
      recentRequests,
      recentNotifications,
    ] = await Promise.all([
      prisma.serviceRequest.count({ where: { creatorId: user.id } }),
      prisma.serviceRequest.count({ where: { creatorId: user.id, status: RequestStatus.OPEN } }),
      prisma.serviceRequest.count({
        where: {
          creatorId: user.id,
          status: { in: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.WAITING_FOR_EMPLOYEE] },
        },
      }),
      prisma.serviceRequest.count({
        where: { creatorId: user.id, status: { in: [RequestStatus.RESOLVED, RequestStatus.CLOSED] } },
      }),
      prisma.task.count({
        where: {
          assigneeId: user.id,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
      prisma.serviceRequest.findMany({
        where: { creatorId: user.id },
        include: {
          category: { select: { id: true, name: true } },
          assignedAgent: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMyRequests,
          openRequests,
          inProgressRequests,
          resolvedRequests,
          myAssignedTasks,
        },
        recentRequests,
        recentNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAgentDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 3600 * 1000);

    const [
      myAssignedRequests,
      unassignedRequests,
      inProgressRequests,
      criticalRequests,
      slaAtRiskRequests,
      myAssignedTasks,
      urgentTasks,
      recentAssigned,
    ] = await Promise.all([
      prisma.serviceRequest.count({
        where: {
          assignedAgentId: user.id,
          status: { in: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.WAITING_FOR_EMPLOYEE] },
        },
      }),
      prisma.serviceRequest.count({
        where: {
          assignedAgentId: null,
          status: RequestStatus.OPEN,
        },
      }),
      prisma.serviceRequest.count({
        where: {
          assignedAgentId: user.id,
          status: RequestStatus.IN_PROGRESS,
        },
      }),
      prisma.serviceRequest.count({
        where: {
          priority: RequestPriority.CRITICAL,
          status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
        },
      }),
      prisma.serviceRequest.count({
        where: {
          status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
          resolutionDeadline: { lte: twoHoursLater },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: user.id,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: user.id,
          priority: TaskPriority.URGENT,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
      prisma.serviceRequest.findMany({
        where: { assignedAgentId: user.id },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          myAssignedRequests,
          unassignedRequests,
          inProgressRequests,
          criticalRequests,
          slaAtRiskRequests,
          myAssignedTasks,
          urgentTasks,
        },
        recentAssigned,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();

    const [
      totalRequests,
      openRequests,
      resolvedRequests,
      totalTasks,
      completedTasks,
      totalUsers,
      activeAgents,
      categories,
      requestPriorityCounts,
      recentAudits,
      resolvedWithDeadline,
    ] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({
        where: { status: { in: [RequestStatus.OPEN, RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS] } },
      }),
      prisma.serviceRequest.count({
        where: { status: { in: [RequestStatus.RESOLVED, RequestStatus.CLOSED] } },
      }),
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: Role.AGENT, isActive: true } }),
      prisma.requestCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { serviceRequests: true } },
        },
      }),
      prisma.serviceRequest.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.serviceRequest.findMany({
        where: {
          status: { in: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
          resolvedAt: { not: null },
          resolutionDeadline: { not: null },
        },
        select: { resolvedAt: true, resolutionDeadline: true },
      }),
    ]);

    // Calculate actual database-driven SLA compliance rate
    let met = 0;
    resolvedWithDeadline.forEach((r) => {
      if (r.resolvedAt! <= r.resolutionDeadline!) met++;
    });
    const totalResolvedSla = resolvedWithDeadline.length;
    const slaComplianceRate = totalResolvedSla > 0 ? Math.round((met / totalResolvedSla) * 100) : 100;

    const categoryDistribution = categories.map((c) => ({
      name: c.name,
      count: c._count.serviceRequests,
    }));

    const priorityDistribution = requestPriorityCounts.map((p) => ({
      priority: p.priority,
      count: p._count.id,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRequests,
          openRequests,
          resolvedRequests,
          totalTasks,
          completedTasks,
          totalUsers,
          activeAgents,
          slaComplianceRate,
        },
        categoryDistribution,
        priorityDistribution,
        recentAudits,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 72 * 3600 * 1000);

    const [
      totalTasks,
      myTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      inReviewTasks,
      blockedTasks,
      overdueTasks,
      dueSoonTasks,
      priorityGroups,
      statusGroups,
      workloadData,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { assigneeId: user.id } }),
      prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { status: TaskStatus.TODO } }),
      prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
      prisma.task.count({ where: { status: TaskStatus.BLOCKED } }),
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
      prisma.task.count({
        where: {
          dueDate: { gte: now, lte: threeDaysFromNow },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
          assignedTasks: { some: {} },
        },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          _count: {
            select: {
              assignedTasks: true,
            },
          },
        },
        take: 6,
      }),
    ]);

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTasks,
          myTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          inReviewTasks,
          blockedTasks,
          overdueTasks,
          dueSoonTasks,
          completionPercentage,
        },
        priorityBreakdown: priorityGroups.map((p) => ({ priority: p.priority, count: p._count.id })),
        statusBreakdown: statusGroups.map((s) => ({ status: s.status, count: s._count.id })),
        teamWorkload: workloadData.map((w) => ({
          name: w.name,
          taskCount: w._count.assignedTasks,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
