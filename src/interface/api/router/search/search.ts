import { Request, Response } from 'express';
import { searchNodes } from '../../../../domain/search';

const searchHandler = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  const portalAddress = req.headers['x-portal-address'] as string | undefined;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  if (!portalAddress) {
    return res.status(400).json({ error: 'Missing required header: x-portal-address is required' });
  }

  const result = searchNodes({ query, limit, skip, portalAddress });

  res.json({
    nodes: result.nodes,
    total: result.total,
    hasNext: result.hasNext
  });
};

export default [searchHandler];
