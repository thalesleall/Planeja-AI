import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateLogin, validateRegister } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /auth/register - Cadastro de usuário
router.post('/register', validateRegister, AuthController.register);

// POST /auth/login - Login de usuário
router.post('/login', validateLogin, AuthController.login);

// GET /auth/me - Obter perfil do usuário autenticado
router.get('/me', authenticateToken, AuthController.getProfile);

export default router;