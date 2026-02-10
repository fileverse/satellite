import { Request, Response } from "express";
import { EventsModel, ApiKeysModel } from "../../../../infra/database/models";

const retryAllFailedHandler = async (req: Request, res: Response) => {
  const apiKey = req.query.apiKey as string;
  const portalAddress = ApiKeysModel.findByApiKey(apiKey)?.portalAddress;
  if (!portalAddress) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  const count = EventsModel.resetAllFailedToPending(portalAddress);
  res.json({ retried: count });
};

export default [retryAllFailedHandler];
