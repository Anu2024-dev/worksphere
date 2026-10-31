import { Router } from 'express';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  addTaskComment,
  deleteTaskComment,
} from '../controllers/task.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assign', authorize(Role.ADMIN, Role.AGENT), assignTask);
router.post('/:id/comments', addTaskComment);
router.delete('/comments/:commentId', deleteTaskComment);

export default router;
