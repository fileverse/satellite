import { Request, Response } from 'express';
import { getFile } from '../../../../domain/file';

const getHandler = async (req: Request, res: Response) => {
  const { ddocId } = req.params;

  if (!ddocId) {
    return res.status(400).json({ error: 'ddocId is required' });
  }

  try {
    const file = getFile(ddocId);

    if (!file) {
      return res.status(404).json({ error: 'DDoc not found' });
    }

    res.json(file);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export default [getHandler];
