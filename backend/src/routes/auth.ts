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

// POST /auth/refresh - Refresh access token using HttpOnly refresh cookie
router.post('/refresh', AuthController.refresh);
// POST /auth/logout - clears refresh cookie and revokes token
router.post('/logout', AuthController.logout);

// GET /auth/refresh-tokens - list current user's refresh tokens
router.get('/refresh-tokens', authenticateToken, AuthController.listTokens);

// DELETE /auth/refresh-tokens/:id - revoke a specific refresh token (owned by user)
router.delete('/refresh-tokens/:id', authenticateToken, AuthController.revokeToken);

export default router;