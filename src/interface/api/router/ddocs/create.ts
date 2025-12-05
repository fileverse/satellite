import { Request, Response } from 'express';

const createHandler = async (req: Request, res: Response) => {
  // Implement create logic
  res.status(501).json({ message: 'Not implemented' });
};

export default [createHandler];
