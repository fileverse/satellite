import { getRuntimeConfig, isUsingPublicRpc, isRpc429Error, RPC_429_USER_MESSAGE } from "../../config";
import { handleNewFileOp, getProxyAuthParams, handleExistingFileOp } from "../../domain/portal";
import { FilesModel, EventsModel } from "../database/models";
import type { Event, ProcessResult, UpdateFilePayload } from "../../types";
import { logger } from "../index";
import { waitForUserOpReceipt } from "../../sdk/pimlico-utils";
import { parseFileEventLog } from "../../sdk/file-utils";
import { ADDED_FILE_EVENT } from "../../constants";
import { RateLimitError, normalizeRateLimitError } from "../../errors/rate-limit";

export type { ProcessResult };

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
    let errorMsg = error instanceof Error ? error.message : String(error);
    if (isUsingPublicRpc() && isRpc429Error(error)) {
      errorMsg = RPC_429_USER_MESSAGE;
    }
    logger.error(`Error processing ${type} event for file ${fileId}: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
};

const onTransactionSuccess = (
  fileId: string,
  file: ReturnType<typeof FilesModel.findByIdIncludingDeleted>,
  onChainFileId: number,
  pending: { linkKey: string; linkKeyNonce: string; commentKey: string; metadata: Record<string, unknown> },
): void => {
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
  const updatedFile = FilesModel.update(fileId, payload, file!.portalAddress);
  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: "synced" }, file!.portalAddress);
  }
};

const processCreateEvent = async (event: Event): Promise<void> => {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
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
      EventsModel.clearEventPendingOp(event._id);
      throw new Error(`User operation failed: ${receipt.reason}`);
    }
    const onChainFileId = parseFileEventLog(receipt.logs, "AddedFile", ADDED_FILE_EVENT);
    const pending = JSON.parse(event.pendingPayload!) as {
      linkKey: string;
      linkKeyNonce: string;
      commentKey: string;
      metadata: Record<string, unknown>;
    };
    onTransactionSuccess(fileId, file, onChainFileId, pending);
    EventsModel.clearEventPendingOp(event._id);
    logger.info(`File ${file.ddocId} created and published successfully (resumed from pending op)`);
    return;
  }

  const result = await handleNewFileOp(fileId);
  EventsModel.setEventPendingOp(event._id, result.userOpHash, {
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
    EventsModel.clearEventPendingOp(event._id);
    throw new Error(`User operation failed: ${receipt.reason}`);
  }
  const onChainFileId = parseFileEventLog(receipt.logs, "AddedFile", ADDED_FILE_EVENT);
  onTransactionSuccess(fileId, file, onChainFileId, {
    linkKey: result.linkKey,
    linkKeyNonce: result.linkKeyNonce,
    commentKey: result.commentKey,
    metadata: result.metadata,
  });
  EventsModel.clearEventPendingOp(event._id);
  logger.info(`File ${file.ddocId} created and published successfully`);
};

const processUpdateEvent = async (event: Event): Promise<void> => {
  const { fileId } = event;

  const file = FilesModel.findByIdExcludingDeleted(fileId);
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
  const updatedFile = FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: "synced" }, file.portalAddress);
  }
  logger.info(`File ${file.ddocId} updated and published successfully`);
};

const processDeleteEvent = async (event: Event): Promise<void> => {
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
    const result = await handleExistingFileOp(fileId, "delete");
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    payload.onchainVersion = file.localVersion;
    payload.metadata = result.metadata;
    payload.isDeleted = 1;
  }

  FilesModel.update(fileId, payload, file.portalAddress);

  logger.info(`File ${fileId} delete event processed (syncStatus set to synced)`);
};
