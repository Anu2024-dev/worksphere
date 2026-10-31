import { Router } from 'express';
import { register, login, logout, getMe, changePassword, updateProfile } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.patch('/password', authenticateToken, changePassword);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
