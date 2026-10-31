import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', listCategories);
router.post('/', authorize(Role.ADMIN), createCategory);
router.patch('/:id', authorize(Role.ADMIN), updateCategory);
router.delete('/:id', authorize(Role.ADMIN), deleteCategory);

export default router;
