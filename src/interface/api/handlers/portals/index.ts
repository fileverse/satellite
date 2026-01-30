import { Request, Response } from 'express';
import { savePortal } from '../../../../domain/portal/savePortal';
import { addApiKey } from '../../../../domain/portal/saveApiKey';
import { removeApiKey } from '../../../../domain/portal/removeApiKey';

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

const removeKeyHandler = async (req: Request, res: Response) => {
  try {
    const { collaboratorAddress } = req.body;

    if (!collaboratorAddress) {
      return res.status(400).json({
        error: 'collaboratorAddress is required in request payload'
      });
    }

    const deletedApiKey = removeApiKey(collaboratorAddress);
    res.status(200).json({
      message: 'API key removed successfully',
      data: deletedApiKey,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const addPortal = [addPortalHandler];
export const addKey = [addKeyHandler];
export const removeKey = [removeKeyHandler];
