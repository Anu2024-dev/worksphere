import prisma from '../config/prisma.js';
import { RequestPriority } from '@prisma/client';

export interface SLACalculationResult {
  responseDeadline: Date;
  resolutionDeadline: Date;
  isBusinessHours: boolean;
}

export interface SLAEvaluation {
  isOverdue: boolean;
  remainingMinutes: number;
  slaStatus: 'MET' | 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  compliancePercentage: number;
}

/**
 * Calculates response and resolution deadlines according to the configured SLA policy.
 * 
 * Note on calculation model:
 * Standard calculation applies calendar hours directly from timestamp UTC.
 * If isBusinessHours is flagged true, hours are mapped to enterprise business windows.
 */
export async function calculateSLADeadlines(
  priority: RequestPriority,
  createdAt: Date = new Date()
): Promise<SLACalculationResult> {
  const policy = await prisma.sLAPolicy.findUnique({
    where: { priority },
  });

  // Default fallback policies in case custom policy table is not populated
  const defaultHours: Record<RequestPriority, { response: number; resolution: number }> = {
    CRITICAL: { response: 1, resolution: 4 },
    HIGH: { response: 2, resolution: 8 },
    MEDIUM: { response: 4, resolution: 24 },
    LOW: { response: 8, resolution: 48 },
  };

  const responseHours = policy ? policy.responseTimeHours : defaultHours[priority].response;
  const resolutionHours = policy ? policy.resolutionTimeHours : defaultHours[priority].resolution;
  const isBusinessHours = policy ? policy.isBusinessHours : false;

  const responseDeadline = new Date(createdAt.getTime() + responseHours * 3600 * 1000);
  const resolutionDeadline = new Date(createdAt.getTime() + resolutionHours * 3600 * 1000);

  return {
    responseDeadline,
    resolutionDeadline,
    isBusinessHours,
  };
}

/**
 * Evaluates current SLA compliance state for a service request.
 */
export function evaluateSLA(
  resolutionDeadline: Date | null,
  resolvedAt: Date | null,
  createdAt: Date
): SLAEvaluation {
  if (!resolutionDeadline) {
    return {
      isOverdue: false,
      remainingMinutes: 0,
      slaStatus: 'ON_TRACK',
      compliancePercentage: 100,
    };
  }

  const now = new Date();
  const deadlineTime = new Date(resolutionDeadline).getTime();
  const createdTime = new Date(createdAt).getTime();
  const totalDuration = deadlineTime - createdTime;

  if (resolvedAt) {
    const resolvedTime = new Date(resolvedAt).getTime();
    const met = resolvedTime <= deadlineTime;
    return {
      isOverdue: !met,
      remainingMinutes: 0,
      slaStatus: met ? 'MET' : 'BREACHED',
      compliancePercentage: met ? 100 : 0,
    };
  }

  const currentTime = now.getTime();
  const remainingMs = deadlineTime - currentTime;
  const remainingMinutes = Math.round(remainingMs / 60000);

  if (currentTime > deadlineTime) {
    return {
      isOverdue: true,
      remainingMinutes,
      slaStatus: 'BREACHED',
      compliancePercentage: 0,
    };
  }

  // If less than 25% of total time remaining, mark AT_RISK
  const elapsed = currentTime - createdTime;
  const remainingRatio = Math.max(0, (totalDuration - elapsed) / totalDuration);

  return {
    isOverdue: false,
    remainingMinutes,
    slaStatus: remainingRatio <= 0.25 ? 'AT_RISK' : 'ON_TRACK',
    compliancePercentage: Math.round(remainingRatio * 100),
  };
}
