import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createCategorySchema, updateCategorySchema } from '../validators/admin.validator.js';

export async function listCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await prisma.requestCategory.findMany({
      include: {
        defaultDepartment: { select: { id: true, name: true } },
        _count: { select: { serviceRequests: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.requestCategory.create({
      data: {
        name: data.name,
        description: data.description,
        defaultDepartmentId: data.defaultDepartmentId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateCategorySchema.parse(req.body);

    const category = await prisma.requestCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        defaultDepartmentId: data.defaultDepartmentId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const count = await prisma.serviceRequest.count({ where: { categoryId: id } });
    if (count > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated service requests.',
      });
      return;
    }

    await prisma.requestCategory.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
