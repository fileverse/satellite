import { Request, Response } from 'express';
import { createFolder, CreateFolderInput } from '../../../../domain/folder';

const createHandler = async (req: Request, res: Response) => {
  try {
    const input: CreateFolderInput = req.body;

    // Validate required fields
    if (!input.onchainFileId || !input.folderId || !input.folderRef || !input.folderName || !input.portalAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: onchainFileId, folderId, folderRef, folderName, and portalAddress are required' 
      });
    }

    if (!input.metadataIPFSHash) {
      return res.status(400).json({ 
        error: 'Missing required field: metadataIPFSHash is required' 
      });
    }

    if (input.lastTransactionBlockNumber === undefined || 
        input.lastTransactionBlockTimestamp === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: lastTransactionBlockNumber and lastTransactionBlockTimestamp are required' 
      });
    }

    const folder = createFolder(input);
    res.status(201).json(folder);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
};

export default [createHandler];
