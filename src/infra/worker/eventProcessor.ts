import { getRuntimeConfig } from "../../config";
import { publishFile } from "../../domain/portal";
import { FilesModel } from "../database/models";
import type { Event } from "../database/models";
import type { UpdateFilePayload } from "../database/models/files/types";
import { logger } from "../index";

export interface ProcessResult {
  success: boolean;
  error?: string;
}

export async function processEvent(event: Event): Promise<ProcessResult> {
  const { fileId, type } = event;

  try {
    switch (type) {
      case "create":
        await processCreateEvent(event);
        break;
      case "update":
        await processUpdateEvent(event);
        break;
      case "delete":
        await processDeleteEvent(event);
        break;
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing ${type} event for file ${fileId}:`, error);
    return { success: false, error: errorMsg };
  }
}

async function processCreateEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File ${fileId} not found`);
  }

  if (file.isDeleted === 1) {
    logger.info(`File ${fileId} is deleted, skipping create event`);
    return;
  }

  const result = await publishFile(fileId, "add");
  if (!result.success) {
    throw new Error(`Publish failed for file ${fileId}`);
  }

  const frontendUrl = getRuntimeConfig().FRONTEND_URL;
  const payload: UpdateFilePayload = {
    onchainVersion: file.localVersion,
    onChainFileId: result.onChainFileId,
    linkKey: result.linkKey,
    linkKeyNonce: result.linkKeyNonce,
    commentKey: result.commentKey,
    metadata: result.metadata,
    link: `${frontendUrl}/${file.portalAddress}/${result.onChainFileId}#key=${result.linkKey}`,
  };
  const updatedFile = FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
  }

  logger.info(`File ${file.ddocId} created and published successfully`);
}

async function processUpdateEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdExcludingDeleted(fileId);
  if (!file) {
    return;
  }

  if (file.localVersion <= file.onchainVersion) {
    return;
  }

  const result = await publishFile(fileId, "update");
  if (!result.success) {
    throw new Error(`Publish failed for file ${fileId}`);
  }

  const payload: UpdateFilePayload = {
    onchainVersion: file.localVersion,
    metadata: result.metadata,
  };
  const updatedFile = FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
  }
  logger.info(`File ${file.ddocId} updated and published successfully`);
}

async function processDeleteEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    return;
  }

  if (file.isDeleted === 1 && file.syncStatus === "synced") {
    logger.info(`File ${fileId} deletion already synced, skipping`);
    return;
  }

  const payload: UpdateFilePayload = {
    syncStatus: "synced",
    isDeleted: 1,
  };

  if (file.onChainFileId !== null || file.onChainFileId !== undefined) {
    const result = await publishFile(fileId, "delete");
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    payload.onchainVersion = file.localVersion;
    payload.metadata = result.metadata;
    payload.isDeleted = 1;
  }

  FilesModel.update(fileId, payload, file.portalAddress);

  logger.info(`File ${fileId} delete event processed (syncStatus set to synced)`);
}
