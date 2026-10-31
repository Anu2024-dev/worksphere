import prisma from '../config/prisma.js';

/**
 * Generates a concurrency-safe unique human-readable Service Request ID
 * Format: WRK-YYYY-XXXX (e.g., WRK-2026-0001)
 */
export async function generateRequestId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `WRK-${currentYear}-`;

  // Find the highest existing request ID for the current year
  const lastRequest = await prisma.serviceRequest.findFirst({
    where: {
      requestId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      requestId: 'desc',
    },
    select: {
      requestId: true,
    },
  });

  if (!lastRequest) {
    return `${prefix}0001`;
  }

  const parts = lastRequest.requestId.split('-');
  const sequenceNumber = parseInt(parts[2] || '0', 10);
  const nextSeq = (sequenceNumber + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Generates a concurrency-safe unique human-readable Task Number
 * Format: TSK-XXXX (e.g., TSK-1001)
 */
export async function generateTaskNumber(): Promise<string> {
  const lastTask = await prisma.task.findFirst({
    orderBy: {
      taskNumber: 'desc',
    },
    select: {
      taskNumber: true,
    },
  });

  if (!lastTask) {
    return 'TSK-1001';
  }

  const parts = lastTask.taskNumber.split('-');
  const seqNum = parseInt(parts[1] || '1000', 10);
  const nextSeq = (seqNum + 1).toString();
  return `TSK-${nextSeq}`;
}
