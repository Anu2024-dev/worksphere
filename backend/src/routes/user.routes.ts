import { Router } from 'express';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  getAgentsWorkload,
} from '../controllers/user.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

// All authenticated users can list users (for dropdowns / assigning tasks)
router.get('/', listUsers);
router.get('/workload', authorize(Role.ADMIN, Role.AGENT), getAgentsWorkload);
router.get('/:id', getUserById);

// Admin only actions
router.post('/', authorize(Role.ADMIN), createUser);
router.patch('/:id', authorize(Role.ADMIN), updateUser);
router.patch('/:id/status', authorize(Role.ADMIN), updateUserStatus);

export default router;
