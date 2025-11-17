import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Diretório de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads/tasks');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.taskId;
    const taskDir = path.join(UPLOAD_DIR, taskId, 'original');
    
    // Criar diretório da task se não existir
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
    
    cb(null, taskDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp-hash-original.ext
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WebP, SVG ou PDF'), false);
  }
};

// Configuração do multer
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Máximo 10 arquivos por vez
  }
});
