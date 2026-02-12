import { Hono } from "hono";
import { listFiles, getFile, createFile, updateFile, deleteFile } from "../../domain/file/index.js";
import type { CreateFileInput, UpdateFileInput, ClientUpdateFileInput } from "../../types/index.js";
import { ApiKeysModel } from "../../infra/database/models/index.js";
import { getRuntimeConfig } from "../../config/index.js";
import type { AppEnv } from "../index.js";

const ddocsRoutes = new Hono<AppEnv>();

function extractTitleAndContent(body: Record<string, any>, file?: globalThis.File): { title: string | undefined; fileContent: string | undefined } {
  if (file) {
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    return {
      title: lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName,
      fileContent: undefined, // will be set async
    };
  }
  return {
    title: body.title,
    fileContent: body.content,
  };
}

// GET / - list ddocs
ddocsRoutes.get("/", async (c) => {
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined;
  const skip = c.req.query("skip") ? parseInt(c.req.query("skip")!, 10) : undefined;
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
  return c.json({
    ddocs: result.ddocs,
    total: result.total,
    hasNext: result.hasNext,
  });
});

// GET /:ddocId - get single ddoc
ddocsRoutes.get("/:ddocId", async (c) => {
  const ddocId = c.req.param("ddocId");
  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) {
    throw new Error("API key is required");
  }
  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  if (!apiKeyInfo) {
    throw new Error("Invalid API key");
  }
  const portalAddress = apiKeyInfo.portalAddress;

  if (!ddocId) {
    return c.json({ error: "ddocId is required" }, 400);
  }
  if (!portalAddress) {
    return c.json({ error: "Missing required header: x-portal-address is required" }, 400);
  }

  try {
    const file = await getFile(ddocId, portalAddress);
    if (!file) {
      return c.json({ error: "DDoc not found" }, 404);
    }
    return c.json(file);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST / - create ddoc
ddocsRoutes.post("/", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    let title: string | undefined;
    let fileContent: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const file = body["file"];
      if (file && file instanceof globalThis.File) {
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        title = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        fileContent = await file.text();
      } else {
        title = body["title"] as string;
        fileContent = body["content"] as string;
      }
    } else {
      const body = await c.req.json();
      title = body.title;
      fileContent = body.content;
    }

    const apiKey = getRuntimeConfig().API_KEY;
    if (!apiKey) {
      return c.json({ error: "Missing required header: x-api-key is required" }, 400);
    }

    if (!title) {
      return c.json({
        error:
          "Missing required field: title is required. When uploading a file, title is derived from the file name. When providing content directly, title must be provided.",
      }, 400);
    }

    if (!fileContent) {
      return c.json({
        error: "Missing content: Either provide a file upload or fileContent text field",
      }, 400);
    }

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
    if (!apiKeyInfo) {
      return c.json({ error: "Invalid API key" }, 400);
    }
    const portalAddress = apiKeyInfo.portalAddress;

    const payload: CreateFileInput = {
      title,
      content: fileContent,
      portalAddress,
    };

    const file = await createFile(payload);
    return c.json({
      message: "File created successfully. Sync to on-chain is pending.",
      data: { ...file },
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// PUT /:ddocId - update ddoc
ddocsRoutes.put("/:ddocId", async (c) => {
  try {
    const ddocId = c.req.param("ddocId");
    const contentType = c.req.header("content-type") || "";
    let title: string | undefined;
    let fileContent: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const file = body["file"];
      if (file && file instanceof globalThis.File) {
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        title = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        fileContent = await file.text();
      } else {
        title = body["title"] as string;
        fileContent = body["content"] as string;
      }
    } else {
      const body = await c.req.json();
      title = body.title;
      fileContent = body.content;
    }

    const apiKeySeed = getRuntimeConfig().API_KEY;
    if (!apiKeySeed) {
      return c.json({ error: "Missing required header: x-portal-address is required" }, 400);
    }

    if (!title && !fileContent) {
      return c.json({
        error:
          "At least one field is required: Either provide title, content, or both. When uploading a file, title is derived from the file name. When providing content directly, you can provide title and/or content.",
      }, 400);
    }

    const clientPayload: ClientUpdateFileInput = {};
    if (title) clientPayload.title = title;
    if (fileContent) clientPayload.content = fileContent;

    const domainPayload: UpdateFileInput = {
      title: clientPayload.title,
      content: clientPayload.content,
    };

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKeySeed);
    if (!apiKeyInfo) {
      return c.json({ error: "Invalid API key" }, 400);
    }
    const portalAddress = apiKeyInfo.portalAddress;

    const result = await updateFile(ddocId, domainPayload, portalAddress);
    return c.json({
      message: "File updated successfully",
      data: { ...result },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// DELETE /:ddocId - delete ddoc
ddocsRoutes.delete("/:ddocId", async (c) => {
  try {
    const ddocId = c.req.param("ddocId");
    const apiKey = getRuntimeConfig().API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key is required" }, 400);
    }

    const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
    if (!apiKeyInfo) {
      return c.json({ error: "Invalid API key" }, 400);
    }
    const portalAddress = apiKeyInfo.portalAddress;

    if (!ddocId) {
      return c.json({ error: "ddocId is required" }, 400);
    }
    if (!portalAddress) {
      return c.json({ error: "Missing required header: x-portal-address is required" }, 400);
    }

    const result = await deleteFile(ddocId, portalAddress);
    return c.json({
      message: "File deleted successfully",
      data: { ...result },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export { ddocsRoutes };
