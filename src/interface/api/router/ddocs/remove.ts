import { Request, Response } from 'express';

const removeHandler = async (req: Request, res: Response) => {
  // Implement remove logic
  res.status(501).json({ message: 'Not implemented' });
};

export default [removeHandler];
