import { Request, Response } from "express";
import { EventsModel, ApiKeysModel } from "../../../../infra/database/models";

const listFailedHandler = async (req: Request, res: Response) => {
  const apiKey = req.query.apiKey as string;
  const portalAddress = ApiKeysModel.findByApiKey(apiKey)?.portalAddress;
  if (!portalAddress) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  const events = EventsModel.listFailed(portalAddress);
  res.json(events);
};

export default [listFailedHandler];
