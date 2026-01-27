import { Request, Response } from 'express';
import { savePortal } from '../../../../domain/portal/savePortal';
import { addApiKey } from '../../../../domain/portal/saveApiKey';

const addPortalHandler = async (req: Request, res: Response) => {
  try {
    const { portalAddress, portalSeed, ownerAddress } = req.body;

    if (!portalAddress || !portalSeed || !ownerAddress) {
      return res.status(400).json({
        error: 'Missing required fields: portalAddress, portalSeed, and ownerAddress are required'
      });
    }

    const portal = savePortal({ portalAddress, portalSeed, ownerAddress });
    res.status(200).json({
      message: 'Portal saved successfully',
      data: portal,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

const addKeyHandler = async (req: Request, res: Response) => {
  try {
    const { apiKeySeed, name, collaboratorAddress, portalAddress } = req.body;

    if (!apiKeySeed || !name || !collaboratorAddress || !portalAddress) {
      return res.status(400).json({
        error: 'Missing required fields: apiKeySeed, name, collaboratorAddress, and portalAddress are required'
      });
    }

    const apiKey = addApiKey({ apiKeySeed, name, collaboratorAddress, portalAddress });
    res.status(201).json({
      message: 'API key added successfully',
      data: apiKey,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const addPortal = [addPortalHandler];
export const addKey = [addKeyHandler];
