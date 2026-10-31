import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { updateUserStatusSchema } from '../validators/admin.validator.js';
import { registerSchema } from '../validators/auth.validator.js';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, departmentId, search, isActive, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role as Role;
    if (departmentId) where.departmentId = departmentId as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { jobTitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
          department: {
            select: { id: true, name: true },
          },
          jobTitle: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              assignedRequests: true,
              assignedTasks: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            createdTasks: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, departmentId, jobTitle, phone } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password || 'WorkSphere@123', 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: (role as Role) || Role.EMPLOYEE,
        departmentId: departmentId || null,
        jobTitle,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        details: { email: newUser.email, role: newUser.role },
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        jobTitle: true,
        phone: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: id,
        details: data,
      },
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = updateUserStatusSchema.parse(req.body);

    if (req.user?.id === id && !isActive) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own administrative account.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id,
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'USER',
        entityId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAgentsWorkload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: { in: [Role.AGENT, Role.ADMIN] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        avatarUrl: true,
        department: {
          select: { id: true, name: true },
        },
        assignedRequests: {
          where: {
            status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'REOPENED'] },
          },
          select: { id: true, priority: true, status: true },
        },
        assignedTasks: {
          where: {
            status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] },
          },
          select: { id: true, priority: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const workloadData = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      jobTitle: agent.jobTitle,
      avatarUrl: agent.avatarUrl,
      department: agent.department?.name || 'Unassigned',
      activeRequestsCount: agent.assignedRequests.length,
      activeTasksCount: agent.assignedTasks.length,
      totalActiveWorkload: agent.assignedRequests.length + agent.assignedTasks.length,
      criticalRequestsCount: agent.assignedRequests.filter((r) => r.priority === 'CRITICAL').length,
    }));

    res.status(200).json({
      success: true,
      data: workloadData,
    });
  } catch (error) {
    next(error);
  }
}
