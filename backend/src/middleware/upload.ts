import multer from 'multer';
import path from 'path';
import { Request } from 'express';

/**
 * Multer configuration for CSV file uploads
 * - Max file size: 10MB
 * - Only .csv files allowed
 * - Stored in memory (no disk persistence needed)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = [
      'text/csv',
      'application/csv',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
      'text/plain',
    ];

    if (ext === '.csv' || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export default upload;
