import { Router } from 'express';
import {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  assignRequest,
  addRequestComment,
  reopenRequest,
  getLinkedTasks,
  linkTaskToRequest,
  unlinkTaskFromRequest,
} from '../controllers/request.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', listRequests);
router.post('/', createRequest);
router.get('/:id', getRequestById);
router.patch('/:id', updateRequest);
router.patch('/:id/status', updateRequestStatus);
router.patch('/:id/assign', authorize(Role.ADMIN, Role.AGENT), assignRequest);
router.post('/:id/comments', addRequestComment);
router.post('/:id/reopen', reopenRequest);

// Integration routes (linked tasks)
router.get('/:id/tasks', getLinkedTasks);
router.post('/:id/tasks', authorize(Role.ADMIN, Role.AGENT), linkTaskToRequest);
router.delete('/:requestId/tasks/:taskId', authorize(Role.ADMIN, Role.AGENT), unlinkTaskFromRequest);

export default router;
