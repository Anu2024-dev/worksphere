import { Router } from 'express';
import {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/team.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/', listTeams);
router.get('/:id', getTeamById);
router.post('/', authorize(Role.ADMIN), createTeam);
router.patch('/:id', authorize(Role.ADMIN), updateTeam);
router.post('/:id/members', authorize(Role.ADMIN), addTeamMember);
router.delete('/:id/members/:userId', authorize(Role.ADMIN), removeTeamMember);

export default router;
