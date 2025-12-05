import { Request, Response } from 'express';

const getHandler = async (req: Request, res: Response) => {
  // Implement get logic
  res.status(501).json({ message: 'Not implemented' });
};

export default [getHandler];
