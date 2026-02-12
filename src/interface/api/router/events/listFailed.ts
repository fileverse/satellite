import { Request, Response } from "express";
import { EventsModel, ApiKeysModel } from "../../../../infra/database/models";

const listFailedHandler = async (req: Request, res: Response) => {
  const apiKey = req.query.apiKey as string;
  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  const portalAddress = apiKeyInfo?.portalAddress;
  if (!portalAddress) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  const events = await EventsModel.listFailed(portalAddress);
  res.json(events);
};

export default [listFailedHandler];
