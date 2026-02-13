import { Request, Response } from "express";
import { listFiles, getFile, createFile, updateFile, deleteFile } from "../../../../domain/file";
import type { CreateFileInput, UpdateFileInput, ClientUpdateFileInput } from "../../../../types";
import { createMiddleware, updateMiddleware } from "./customMiddlewares";
import { extractTitleAndContent } from "./helper";
import { ApiKeysModel } from "../../../../infra/database/models";
import { config, getRuntimeConfig } from "../../../../config";

const listHandler = async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) {
    throw new Error("API key is required");
  }
  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  if (!apiKeyInfo) {
    throw new Error("Invalid API key");
  }
  const portalAddress = apiKeyInfo.portalAddress;

  if (!portalAddress) {
    throw new Error("Portal address is required");
  }

  const result = await listFiles({ limit, skip, portalAddress });

  res.json({
    ddocs: result.ddocs,
    total: result.total,
    hasNext: result.hasNext,
  });
};

const getHandler = async (req: Request, res: Response) => {
  const { ddocId } = req.params;
  const apiKey = config.API_KEY as string;
  if (!apiKey) {
    throw new Error("API key is required");
  }
  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  if (!apiKeyInfo) {
    throw new Error("Invalid API key");
  }
  const portalAddress = apiKeyInfo.portalAddress;

  if (!ddocId) {
    return res.status(400).json({ error: "ddocId is required" });
  }

  if (!portalAddress) {
    return res.status(400).json({ error: "Missing required header: x-portal-address is required" });
  }

  try {
    const file = await getFile(ddocId, portalAddress);

    if (!file) {
      return res.status(404).json({ error: "DDoc not found" });
    }

    res.json(file);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

const createHandler = async (req: Request, res: Response) => {
  try {
    const { title, fileContent } = extractTitleAndContent(req);
    const apiKey = getRuntimeConfig().API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "Missing required header: x-api-key is required" });
    }

    if (!title) {
      return res.status(400).json({
        error:
          "Missing required field: title is required. When uploading a file, title is derived from the file name. When providing content directly, title must be provided.",
      });
    }

    if (!fileContent) {
      return res.status(400).json({
        error: "Missing content: Either provide a file upload or fileContent text field",
      });
    }

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
    if (!apiKeyInfo) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    const portalAddress = apiKeyInfo.portalAddress;



    const payload: CreateFileInput = {
      title: title,
      content: fileContent,
      portalAddress,
    };

    const file = await createFile(payload);
    res.status(201).json({
      message: "File created successfully. Sync to on-chain is pending.",
      data: { ...file },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

const updateHandler = async (req: Request, res: Response) => {
  try {
    const { ddocId } = req.params;
    const { title, fileContent } = extractTitleAndContent(req);
    const apiKeySeed = getRuntimeConfig().API_KEY;

    if (!apiKeySeed) {
      return res.status(400).json({
        error: "Missing required header: x-portal-address is required",
      });
    }

    // At least one of title or content must be provided
    if (!title && !fileContent) {
      return res.status(400).json({
        error:
          "At least one field is required: Either provide title, content, or both. When uploading a file, title is derived from the file name. When providing content directly, you can provide title and/or content.",
      });
    }

    const clientPayload: ClientUpdateFileInput = {};
    if (title) {
      clientPayload.title = title;
    }
    if (fileContent) {
      clientPayload.content = fileContent;
    }

    // Map client-facing type to domain type
    const domainPayload: UpdateFileInput = {
      title: clientPayload.title,
      content: clientPayload.content,
    };

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKeySeed);
    if (!apiKeyInfo) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    const portalAddress = apiKeyInfo.portalAddress;

    const result = await updateFile(ddocId, domainPayload, portalAddress);
    res.status(200).json({
      message: "File updated successfully",
      data: { ...result },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

const deleteHandler = async (req: Request, res: Response) => {
  try {
    const { ddocId } = req.params;

    const apiKey = getRuntimeConfig().API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
    if (!apiKeyInfo) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    const portalAddress = apiKeyInfo.portalAddress;

    if (!ddocId) {
      return res.status(400).json({ error: "ddocId is required" });
    }

    if (!portalAddress) {
      return res.status(400).json({
        error: "Missing required header: x-portal-address is required",
      });
    }

    const result = await deleteFile(ddocId, portalAddress);
    res.status(200).json({
      message: "File deleted successfully",
      data: { ...result },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const create = [createMiddleware, createHandler];
export const update = [updateMiddleware, updateHandler];
export const list = [listHandler];
export const get = [getHandler];
export const del = [deleteHandler];
