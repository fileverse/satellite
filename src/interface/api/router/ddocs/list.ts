import { Request, Response } from 'express';

const listHandler = async (req: Request, res: Response) => {
  // Implement list logic
  res.status(501).json({ message: 'Not implemented' });
};

export default [listHandler];
