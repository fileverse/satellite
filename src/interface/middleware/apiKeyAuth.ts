import { Request, Response, NextFunction } from "express";
import { config } from "../../config";

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.query.apiKey as string;

  if (!apiKey || apiKey !== config.API_KEY) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  next();
};
