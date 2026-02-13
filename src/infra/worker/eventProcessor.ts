import { getRuntimeConfig } from "../../config";
import {
  handleNewFileOp,
  handleExistingFileOp,
  getProxyAuthParams,
  submitUpdateFileOp,
  submitDeleteFileOp,
  resolveFileOp,
} from "../../domain/portal";
import { FilesModel, EventsModel } from "../database/models";
import type { Event, ProcessResult, UpdateFilePayload } from "../../types";
import { logger } from "../index";
import { waitForUserOpReceipt } from "../../sdk/pimlico-utils";
import { parseFileEventLog } from "../../sdk/file-utils";
import { ADDED_FILE_EVENT, EDITED_FILE_EVENT, DELETED_FILE_EVENT } from "../../constants";
import { RateLimitError, normalizeRateLimitError } from "../../errors/rate-limit";

export type { ProcessResult };

// ── Legacy single-shot processor (kept for local worker compatibility) ──

export const processEvent = async (event: Event): Promise<ProcessResult> => {
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
    const normalized = normalizeRateLimitError(error);
    if (normalized instanceof RateLimitError) throw normalized;
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing ${type} event for file ${fileId}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};

// ── Two-phase processors for Cloudflare Worker ──

export const submitEvent = async (event: Event): Promise<void> => {
  const { fileId, type } = event;

  switch (type) {
    case "create": {
      console.log("Starting create event submission");
      const file = await FilesModel.findByIdIncludingDeleted(fileId);
      console.log("File found");
      if (!file) throw new Error(`File ${fileId} not found`);
      if (file.isDeleted === 1) {
        logger.info(`File ${fileId} is deleted, skipping create submit`);
        return;
      }

      console.log("Submitting new file op");
      const result = await handleNewFileOp(fileId);
      console.log("New file op submitted");
      await EventsModel.setEventPendingOp(event._id, result.userOpHash, {
        metadata: result.metadata,
      });
      logger.info(`File ${file.ddocId} create op submitted (hash: ${result.userOpHash})`);
      break;
    }
    case "update": {
      const file = await FilesModel.findByIdExcludingDeleted(fileId);
      if (!file) return;
      if (file.localVersion <= file.onchainVersion) return;

      const result = await submitUpdateFileOp(fileId);
      await EventsModel.setEventPendingOp(event._id, result.userOpHash, {
        metadata: result.metadata,
        localVersion: file.localVersion,
      });
      logger.info(`File ${file.ddocId} update op submitted (hash: ${result.userOpHash})`);
      break;
    }
    case "delete": {
      const file = await FilesModel.findByIdIncludingDeleted(fileId);
      if (!file) return;
      if (file.isDeleted === 1 && file.syncStatus === "synced") {
        logger.info(`File ${fileId} deletion already synced, skipping`);
        return;
      }
      if (file.onChainFileId === null || file.onChainFileId === undefined) {
        // No on-chain file to delete, just mark synced locally
        await FilesModel.update(fileId, { syncStatus: "synced", isDeleted: 1 }, file.portalAddress);
        return;
      }

      const result = await submitDeleteFileOp(fileId);
      await EventsModel.setEventPendingOp(event._id, result.userOpHash, {});
      logger.info(`File ${file.ddocId} delete op submitted (hash: ${result.userOpHash})`);
      break;
    }
    default:
      throw new Error(`Unknown event type: ${type}`);
  }
};

export const resolveEvent = async (event: Event): Promise<{ resolved: boolean }> => {
  const { fileId, type, userOpHash } = event;
  if (!userOpHash) {
    logger.warn(`Event ${event._id} has no userOpHash, cannot resolve`);
    return { resolved: false };
  }

  const result = await resolveFileOp(fileId, userOpHash, type);
  if (!result) {
    return { resolved: false };
  }

  const { receipt } = result;
  if (!receipt.success) {
    await EventsModel.clearEventPendingOp(event._id);
    throw new Error(`User operation failed: ${receipt.reason}`);
  }

  switch (type) {
    case "create": {
      const file = await FilesModel.findByIdIncludingDeleted(fileId);
      if (!file) throw new Error(`File ${fileId} not found during resolve`);

      const onChainFileId = parseFileEventLog(receipt.logs, "AddedFile", ADDED_FILE_EVENT);
      const pending = JSON.parse(event.pendingPayload!) as {
        linkKey: string;
        linkKeyNonce: string;
        commentKey: string;
        metadata: Record<string, unknown>;
      };

      const frontendUrl = getRuntimeConfig().FRONTEND_URL;
      const payload: UpdateFilePayload = {
        onchainVersion: file.localVersion,
        onChainFileId,
        linkKey: pending.linkKey,
        linkKeyNonce: pending.linkKeyNonce,
        commentKey: pending.commentKey,
        metadata: pending.metadata,
        link: `${frontendUrl}/${file.portalAddress}/${onChainFileId}#key=${pending.linkKey}`,
      };
      const updatedFile = await FilesModel.update(fileId, payload, file.portalAddress);
      if (updatedFile.localVersion === updatedFile.onchainVersion) {
        await FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
      }
      await EventsModel.clearEventPendingOp(event._id);
      logger.info(`File ${file.ddocId} create resolved successfully`);
      break;
    }
    case "update": {
      const file = await FilesModel.findByIdExcludingDeleted(fileId);
      if (!file) throw new Error(`File ${fileId} not found during resolve`);

      parseFileEventLog(receipt.logs, "EditedFile", EDITED_FILE_EVENT);
      const pending = JSON.parse(event.pendingPayload!) as {
        metadata: Record<string, unknown>;
        localVersion: number;
      };

      const payload: UpdateFilePayload = {
        onchainVersion: pending.localVersion,
        metadata: pending.metadata,
      };
      const updatedFile = await FilesModel.update(fileId, payload, file.portalAddress);
      if (updatedFile.localVersion === updatedFile.onchainVersion) {
        await FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
      }
      await EventsModel.clearEventPendingOp(event._id);
      logger.info(`File ${file.ddocId} update resolved successfully`);
      break;
    }
    case "delete": {
      const file = await FilesModel.findByIdIncludingDeleted(fileId);
      if (!file) throw new Error(`File ${fileId} not found during resolve`);

      parseFileEventLog(receipt.logs, "DeletedFile", DELETED_FILE_EVENT);
      await FilesModel.update(
        fileId,
        { syncStatus: "synced", isDeleted: 1, onchainVersion: file.localVersion },
        file.portalAddress,
      );
      await EventsModel.clearEventPendingOp(event._id);
      logger.info(`File ${fileId} delete resolved successfully`);
      break;
    }
    default:
      throw new Error(`Unknown event type: ${type}`);
  }

  return { resolved: true };
};

// ── Legacy helpers (used by processEvent) ──

const onTransactionSuccess = async (
  fileId: string,
  file: Awaited<ReturnType<typeof FilesModel.findByIdIncludingDeleted>>,
  onChainFileId: number,
  pending: { linkKey: string; linkKeyNonce: string; commentKey: string; metadata: Record<string, unknown> },
): Promise<void> => {
  const frontendUrl = getRuntimeConfig().FRONTEND_URL;
  const payload: UpdateFilePayload = {
    onchainVersion: file!.localVersion,
    onChainFileId,
    linkKey: pending.linkKey,
    linkKeyNonce: pending.linkKeyNonce,
    commentKey: pending.commentKey,
    metadata: pending.metadata,
    link: `${frontendUrl}/${file!.portalAddress}/${onChainFileId}#key=${pending.linkKey}`,
  };
  const updatedFile = await FilesModel.update(fileId, payload, file!.portalAddress);
  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    await FilesModel.update(fileId, { syncStatus: "synced" }, file!.portalAddress);
  }
};

const processCreateEvent = async (event: Event): Promise<void> => {
  const { fileId } = event;

  const file = await FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File ${fileId} not found`);
  }

  if (file.isDeleted === 1) {
    logger.info(`File ${fileId} is deleted, skipping create event`);
    return;
  }

  const waitContext = await getProxyAuthParams(fileId);
  const timeout = 120000;

  if (event.userOpHash) {
    const receipt = await waitForUserOpReceipt(
      event.userOpHash as `0x${string}`,
      waitContext.authToken,
      waitContext.portalAddress,
      waitContext.invokerAddress,
      timeout,
    );
    if (!receipt.success) {
      await EventsModel.clearEventPendingOp(event._id);
      throw new Error(`User operation failed: ${receipt.reason}`);
    }
    const onChainFileId = parseFileEventLog(receipt.logs, "AddedFile", ADDED_FILE_EVENT);
    const pending = JSON.parse(event.pendingPayload!) as {
      linkKey: string;
      linkKeyNonce: string;
      commentKey: string;
      metadata: Record<string, unknown>;
    };
    await onTransactionSuccess(fileId, file, onChainFileId, pending);
    await EventsModel.clearEventPendingOp(event._id);
    logger.info(`File ${file.ddocId} created and published successfully (resumed from pending op)`);
    return;
  }

  const result = await handleNewFileOp(fileId);
  await EventsModel.setEventPendingOp(event._id, result.userOpHash, {
    linkKey: result.linkKey,
    linkKeyNonce: result.linkKeyNonce,
    commentKey: result.commentKey,
    metadata: result.metadata,
  });

  const receipt = await waitForUserOpReceipt(
    result.userOpHash as `0x${string}`,
    waitContext.authToken,
    waitContext.portalAddress,
    waitContext.invokerAddress,
    timeout,
  );
  if (!receipt.success) {
    await EventsModel.clearEventPendingOp(event._id);
    throw new Error(`User operation failed: ${receipt.reason}`);
  }
  const onChainFileId = parseFileEventLog(receipt.logs, "AddedFile", ADDED_FILE_EVENT);
  await onTransactionSuccess(fileId, file, onChainFileId, {
    linkKey: result.linkKey,
    linkKeyNonce: result.linkKeyNonce,
    commentKey: result.commentKey,
    metadata: result.metadata,
  });
  await EventsModel.clearEventPendingOp(event._id);
  logger.info(`File ${file.ddocId} created and published successfully`);
};

const processUpdateEvent = async (event: Event): Promise<void> => {
  const { fileId } = event;

  const file = await FilesModel.findByIdExcludingDeleted(fileId);
  if (!file) {
    return;
  }

  if (file.localVersion <= file.onchainVersion) {
    return;
  }

  const result = await handleExistingFileOp(fileId, "update");
  if (!result.success) {
    throw new Error(`Publish failed for file ${fileId}`);
  }

  const payload: UpdateFilePayload = {
    onchainVersion: file.localVersion,
    metadata: result.metadata,
  };
  const updatedFile = await FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    await FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
  }
  logger.info(`File ${file.ddocId} updated and published successfully`);
};

const processDeleteEvent = async (event: Event): Promise<void> => {
  const { fileId } = event;

  const file = await FilesModel.findByIdIncludingDeleted(fileId);
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
    const result = await handleExistingFileOp(fileId, "delete");
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    payload.onchainVersion = file.localVersion;
    payload.metadata = result.metadata;
    payload.isDeleted = 1;
  }

  await FilesModel.update(fileId, payload, file.portalAddress);

  logger.info(`File ${fileId} delete event processed (syncStatus set to synced)`);
};
