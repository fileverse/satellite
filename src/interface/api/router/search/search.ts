import { Request, Response } from 'express';
import { searchNodes } from '../../../../domain/search';
import { getRuntimeConfig } from '../../../../config';
import { ApiKeysModel } from '../../../../infra/database/models';

const searchHandler = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  const runtimConfig = getRuntimeConfig();
  const apiKey = runtimConfig.API_KEY;
  if (!apiKey) throw new Error('API key is required');
  const portalAddress = ApiKeysModel.findByApiKey(apiKey)?.portalAddress as string;
  if (!portalAddress) throw new Error('Portal address is required');

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
    hasNext: result.hasNext,
  });
};

export default [searchHandler];
