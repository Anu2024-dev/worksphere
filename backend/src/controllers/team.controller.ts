import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createTeamSchema, updateTeamSchema } from '../validators/admin.validator.js';
import { z } from 'zod';

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['LEAD', 'MEMBER']).default('MEMBER'),
});

export async function listTeams(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { departmentId } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId as string;

    const teams = await prisma.team.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, avatarUrl: true, jobTitle: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeamById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                jobTitle: true,
                avatarUrl: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createTeamSchema.parse(req.body);

    const team = await prisma.team.create({
      data,
      include: {
        department: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      data: team,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateTeamSchema.parse(req.body);

    const team = await prisma.team.update({
      where: { id },
      data,
      include: {
        department: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team updated successfully.',
      data: team,
    });
  } catch (error) {
    next(error);
  }
}

export async function addTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { userId, role } = addMemberSchema.parse(req.body);

    const membership = await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
      update: { role },
      create: {
        teamId: id,
        userId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Member added to team.',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, userId } = req.params;

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Member removed from team.',
    });
  } catch (error) {
    next(error);
  }
}
