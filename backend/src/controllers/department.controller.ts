import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/admin.validator.js';

export async function listDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
            teams: true,
            requests: true,
            tasks: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                },
              },
            },
          },
        },
        users: {
          select: { id: true, name: true, email: true, role: true, jobTitle: true },
        },
      },
    });

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createDepartmentSchema.parse(req.body);

    const department = await prisma.department.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateDepartmentSchema.parse(req.body);

    const department = await prisma.department.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Check for existing records to prevent unsafe deletions
    const count = await prisma.serviceRequest.count({ where: { departmentId: id } });
    if (count > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete department because active service requests are associated with it.',
      });
      return;
    }

    await prisma.department.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
