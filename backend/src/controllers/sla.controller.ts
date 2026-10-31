import { Response, NextFunction } from 'express';
import { RequestPriority } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateSLAPolicySchema } from '../validators/admin.validator.js';

export async function listSLAPolicies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const policies = await prisma.sLAPolicy.findMany({
      orderBy: { priority: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSLAPolicy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateSLAPolicySchema.parse(req.body);

    const updated = await prisma.sLAPolicy.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        action: 'SLA_POLICY_UPDATED',
        entityType: 'POLICY',
        entityId: id,
        details: data,
      },
    });

    res.status(200).json({
      success: true,
      message: 'SLA policy updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSLAComplianceStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();

    // Query resolved requests
    const resolvedRequests = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null },
        resolutionDeadline: { not: null },
      },
      select: {
        id: true,
        priority: true,
        resolvedAt: true,
        resolutionDeadline: true,
        createdAt: true,
      },
    });

    let metCount = 0;
    let breachedCount = 0;

    resolvedRequests.forEach((req) => {
      if (req.resolvedAt! <= req.resolutionDeadline!) {
        metCount++;
      } else {
        breachedCount++;
      }
    });

    // Active requests past deadline
    const activeBreached = await prisma.serviceRequest.count({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'REOPENED'] },
        resolutionDeadline: { lt: now },
      },
    });

    // Active requests approaching deadline (< 2 hours remaining)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 3600 * 1000);
    const activeAtRisk = await prisma.serviceRequest.count({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'REOPENED'] },
        resolutionDeadline: {
          gte: now,
          lte: twoHoursFromNow,
        },
      },
    });

    const totalEvaluated = metCount + breachedCount + activeBreached;
    const complianceRate = totalEvaluated > 0 ? Math.round((metCount / totalEvaluated) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        complianceRate,
        metCount,
        resolvedBreachedCount: breachedCount,
        activeBreachedCount: activeBreached,
        activeAtRiskCount: activeAtRisk,
        totalEvaluated,
      },
    });
  } catch (error) {
    next(error);
  }
}
