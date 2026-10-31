import { Router } from 'express';
import { listSLAPolicies, updateSLAPolicy, getSLAComplianceStats } from '../controllers/sla.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/policies', listSLAPolicies);
router.get('/stats', authorize(Role.ADMIN, Role.AGENT), getSLAComplianceStats);
router.patch('/policies/:id', authorize(Role.ADMIN), updateSLAPolicy);

export default router;
