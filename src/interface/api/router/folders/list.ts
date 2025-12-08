import { Request, Response } from 'express';
import { listFolders } from '../../../../domain/folder';

const listHandler = async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  
  const result = listFolders({ limit, skip });
  
  res.json({
    folders: result.folders,
    total: result.total,
    hasNext: result.hasNext
  });
};

export default [listHandler];
