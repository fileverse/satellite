import { Request, Response } from 'express';
import { getFolder } from '../../../../domain/folder';

const getHandler = async (req: Request, res: Response) => {
  const { folderRef, folderId } = req.params;

  if (!folderRef || !folderId) {
    return res.status(400).json({ error: 'folderRef and folderId are required' });
  }

  try {
    const folder = getFolder(folderRef, folderId);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export default [getHandler];
