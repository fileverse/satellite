import { Request, Response } from 'express';
import { ActivityModel, type Activity } from '../../../../infra/database/models';
import { getRuntimeConfig } from '../../../../config';
import { ApiKeysModel } from '../../../../infra/database/models';

function formatActivityMessage(activity: Activity): string {
  switch (activity.type) {
    case 'add-file':
      return `${activity.apiKeyName} has created document ${activity.documentTitle ?? '(untitled)'}`;
    case 'edit-file':
      return `${activity.apiKeyName} has modified document ${activity.documentTitle ?? '(untitled)'}`;
    case 'delete-file':
      return `${activity.apiKeyName} has deleted document ${activity.documentTitle ?? '(untitled)'}`;
    case 'create-key':
      return `API key ${activity.apiKeyName} has been created`;
    case 'remove-key':
      return `API key ${activity.apiKeyName} has been deleted`;
    default:
      return '';
  }
}

const listHandler = async (req: Request, res: Response) => {
  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing required header: x-api-key is required' });
  }

  const apiKeyInfo = ApiKeysModel.findByApiKey(apiKey);
  if (!apiKeyInfo) {
    return res.status(400).json({ error: 'Invalid API key' });
  }

  const portalAddress = apiKeyInfo.portalAddress;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;

  const { activities, total, hasNext } = ActivityModel.findByPortal(
    portalAddress,
    limit,
    skip
  );

  const items = activities.map((activity) => ({
    ...activity,
    message: formatActivityMessage(activity),
  }));

  res.json({
    activities: items,
    total,
    hasNext,
  });
};

export const list = [listHandler];
