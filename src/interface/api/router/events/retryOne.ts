import { Request, Response } from "express";
import { EventsModel, ApiKeysModel } from "../../../../infra/database/models";

const retryOneHandler = async (req: Request, res: Response) => {
  const apiKey = req.query.apiKey as string;
  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  const portalAddress = apiKeyInfo?.portalAddress;
  if (!portalAddress) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  const _id = req.params.id as string;
  const updated = await EventsModel.resetFailedToPending(_id, portalAddress);
  if (!updated) {
    return res.status(404).json({ error: "Event not found or not in failed state" });
  }
  res.json({ ok: true });
};

export default [retryOneHandler];
