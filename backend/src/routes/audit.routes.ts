import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.get('/', authorize(Role.ADMIN), listAuditLogs);

export default router;
