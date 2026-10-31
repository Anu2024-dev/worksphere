import { Router } from 'express';
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', listDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorize(Role.ADMIN), createDepartment);
router.patch('/:id', authorize(Role.ADMIN), updateDepartment);
router.delete('/:id', authorize(Role.ADMIN), deleteDepartment);

export default router;
