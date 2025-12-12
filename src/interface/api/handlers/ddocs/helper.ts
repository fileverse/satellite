import { Request } from 'express';

export const extractTitleAndContent = (req: Request): { title: string | undefined; fileContent: string | undefined } => {
  if (req.file) {
    const fileContent = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname;
    const lastDotIndex = fileName.lastIndexOf('.');
    return {
      title: lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName,
      fileContent: fileContent,
    };
  } 
  
  return {
    title: req.body.title,
    fileContent: req.body.content
  };
};

