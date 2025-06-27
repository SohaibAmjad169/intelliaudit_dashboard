import multer from 'multer';
import { mkdirSync, existsSync } from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

// Configure multer for file upload
export const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'audio/flac',
      'audio/x-m4a',
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Supported formats: flac, m4a, mp3, mp4, mpeg, ogg, wav, webm, jpeg, png, jpg`));
    }
  }
});
