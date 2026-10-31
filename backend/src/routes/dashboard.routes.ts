import { Router } from 'express';
import {
  getEmployeeDashboard,
  getAgentDashboard,
  getAdminDashboard,
  getTaskDashboard,
} from '../controllers/dashboard.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/employee', getEmployeeDashboard);
router.get('/agent', authorize(Role.AGENT, Role.ADMIN), getAgentDashboard);
router.get('/admin', authorize(Role.ADMIN), getAdminDashboard);
router.get('/tasks', getTaskDashboard);

export default router;
