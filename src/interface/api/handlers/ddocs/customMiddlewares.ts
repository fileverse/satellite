import { Request, Response } from 'express'
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const createMiddleware = (req: Request, res: Response, next: any) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req, res, next);
    return;
  }
  next();
};

export const updateMiddleware = (req: Request, res: Response, next: any) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req, res, next);
    return;
  }
  next();
}
