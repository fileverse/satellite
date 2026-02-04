import { publishFile } from '../../domain/portal';
import { EventsModel, FilesModel } from '../database/models';
import type { Event } from '../database/models';
import type { UpdateFilePayload } from '../database/models/files/types';
import { logger } from '../index';

/**
 * Fetches the next processing event from the events table (sorted by timestamp ascending),
 * processes it (publishes the file), then marks it as processed.
 * Does nothing if there is no processing event.
 */
export async function processNextEvent(): Promise<void> {
  const event = EventsModel.findNextPending();
  if (!event) {
    return;
  }

  const { _id, fileId, type } = event;

  try {
    switch (type) {
      case 'create':
        await processCreateEvent(event);
        break;
      case 'update':
        await processUpdateEvent(event);
        break;
      case 'delete':
        await processDeleteEvent(event);
        break;
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
    EventsModel.markProcessed(_id);
  } catch (error) {
    logger.error(`Error processing ${type} event for file ${fileId}:`, error);
    throw error;
  }
}

async function processCreateEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File ${fileId} not found`);
  }

  const result = await publishFile(fileId, 'add');
  if (!result.success) {
    throw new Error(`Publish failed for file ${fileId}`);
  }

  const payload: UpdateFilePayload = {
    onchainVersion: file.localVersion,
    onChainFileId: result.onChainFileId,
    linkKey: result.linkKey,
    linkKeyNonce: result.linkKeyNonce,
    commentKey: result.commentKey,
    metadata: result.metadata,
  };
  const updatedFile = FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: 'synced' }, file.portalAddress);
  }

  logger.info(`File ${fileId} created and published successfully`);
  logger.info(
    `File can be accessed at https://v1-docs.fileverse.io/${file.portalAddress}/${result.onChainFileId}#key=${result.linkKey}`
  );
}

async function processUpdateEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    return;
  }

  if (file.localVersion <= file.onchainVersion) {
    return;
  }

  const result = await publishFile(fileId, 'update');
  if (!result.success) {
    throw new Error(`Publish failed for file ${fileId}`);
  }

  const payload: UpdateFilePayload = {
    onchainVersion: file.localVersion,
    metadata: result.metadata,
  };
  const updatedFile = FilesModel.update(fileId, payload, file.portalAddress);

  if (updatedFile.localVersion === updatedFile.onchainVersion) {
    FilesModel.update(fileId, { syncStatus: 'synced' }, file.portalAddress);
  }
  logger.info(`File ${fileId} updated and published successfully`);
}

async function processDeleteEvent(event: Event): Promise<void> {
  const { fileId } = event;

  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    return;
  }

  // publishFile does not support 'delete' yet; mark as synced so event is consumed
  FilesModel.update(fileId, { syncStatus: 'synced' }, file.portalAddress);
  logger.info(`File ${fileId} delete event processed (syncStatus set to synced)`);
}
