import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Gera thumbnail de uma imagem
 */
export const generateThumbnail = async (
  originalPath: string,
  taskId: string
): Promise<string> => {
  const thumbDir = path.join(__dirname, '../../uploads/tasks', taskId, 'thumbnails');
  
  // Criar diretório de thumbnails
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }
  
  const filename = path.basename(originalPath);
  const thumbPath = path.join(thumbDir, filename);
  
  // Gerar thumbnail 300x300 (mantém proporção)
  await sharp(originalPath)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
  
  return thumbPath;
};

/**
 * Obtém metadados de uma imagem
 */
export const getImageMetadata = async (filePath: string): Promise<ImageMetadata> => {
  const metadata = await sharp(filePath).metadata();
  const stats = fs.statSync(filePath);
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: stats.size
  };
};

/**
 * Comprime uma imagem mantendo qualidade aceitável
 */
export const compressImage = async (
  filePath: string,
  quality: number = 85
): Promise<void> => {
  const tempPath = `${filePath}.temp`;
  
  await sharp(filePath)
    .jpeg({ quality })
    .toFile(tempPath);
  
  // Substituir original
  fs.renameSync(tempPath, filePath);
};

/**
 * Verifica se o arquivo é uma imagem
 */
export const isImage = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};
