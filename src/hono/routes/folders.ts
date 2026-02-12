import { Hono } from "hono";
import { listFolders, getFolder, createFolder } from "../../domain/folder/index.js";
import type { CreateFolderInput } from "../../types/index.js";
import type { AppEnv } from "../index.js";

const foldersRoutes = new Hono<AppEnv>();

// GET / - list folders
foldersRoutes.get("/", async (c) => {
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined;
  const skip = c.req.query("skip") ? parseInt(c.req.query("skip")!, 10) : undefined;

  const result = await listFolders({ limit, skip });
  return c.json({
    folders: result.folders,
    total: result.total,
    hasNext: result.hasNext,
  });
});

// GET /:folderRef/:folderId - get folder with ddocs
foldersRoutes.get("/:folderRef/:folderId", async (c) => {
  const folderRef = c.req.param("folderRef");
  const folderId = c.req.param("folderId");

  if (!folderRef || !folderId) {
    return c.json({ error: "folderRef and folderId are required" }, 400);
  }

  try {
    const folder = await getFolder(folderRef, folderId);
    if (!folder) {
      return c.json({ error: "Folder not found" }, 404);
    }
    return c.json(folder);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST / - create folder
foldersRoutes.post("/", async (c) => {
  try {
    const input: CreateFolderInput = await c.req.json();

    if (!input.onchainFileId || !input.folderId || !input.folderRef || !input.folderName || !input.portalAddress) {
      return c.json({
        error: "Missing required fields: onchainFileId, folderId, folderRef, folderName, and portalAddress are required",
      }, 400);
    }

    if (!input.metadataIPFSHash) {
      return c.json({
        error: "Missing required field: metadataIPFSHash is required",
      }, 400);
    }

    if (input.lastTransactionBlockNumber === undefined || input.lastTransactionBlockTimestamp === undefined) {
      return c.json({
        error: "Missing required fields: lastTransactionBlockNumber and lastTransactionBlockTimestamp are required",
      }, 400);
    }

    const folder = await createFolder(input);
    return c.json(folder, 201);
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: error.message }, 400);
  }
});

export { foldersRoutes };
