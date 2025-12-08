import { Request, Response } from 'express';
import { createFile, CreateFileInput } from '../../../../domain/file';

const createHandler = async (req: Request, res: Response) => {
  try {
    const input: CreateFileInput = req.body;

    // Validate required fields
    if (!input.ddocId || !input.title || !input.portalAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: ddocId, title, and portalAddress are required' 
      });
    }

    if (!input.fileId || !input.metadataIPFSHash || !input.contentIPFSHash || !input.gateIPFSHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileId, metadataIPFSHash, contentIPFSHash, and gateIPFSHash are required' 
      });
    }

    if (input.lastTransactionBlockNumber === undefined || 
        input.lastTransactionBlockTimestamp === undefined || 
        input.createdBlockTimestamp === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: lastTransactionBlockNumber, lastTransactionBlockTimestamp, and createdBlockTimestamp are required' 
      });
    }

    const file = createFile(input);
    res.status(201).json(file);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
};

export default [createHandler];
