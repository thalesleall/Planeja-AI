import { Router } from 'express';
import { AttachmentController } from '../controllers/attachmentController';
import { authenticateToken } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// Upload de arquivos (até 10 por vez)
router.post(
  '/tasks/:taskId/attachments',
  authenticateToken,
  uploadMiddleware.array('files', 10),
  AttachmentController.upload
);

// Listar anexos de uma task
router.get(
  '/tasks/:taskId/attachments',
  authenticateToken,
  AttachmentController.list
);

// Deletar anexo
router.delete(
  '/tasks/:taskId/attachments/:attachmentId',
  authenticateToken,
  AttachmentController.delete
);

// Definir como capa
router.put(
  '/tasks/:taskId/attachments/:attachmentId/set-cover',
  authenticateToken,
  AttachmentController.setCover
);

// Servir arquivo original (público com URL)
router.get('/attachments/:taskId/:filename', AttachmentController.serve);

// Servir thumbnail (público com URL)
router.get('/attachments/:taskId/thumb/:filename', AttachmentController.serveThumbnail);

export default router;
