import { FilesModel } from '../../infra/database/models';
import { logger } from '../../infra';

export interface PublishResult {
  success: boolean;
}

export async function publishFile(fileId: string): Promise<PublishResult> {
  // use findByIdIncludingDeleted to process deleted events as well
  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File with _id ${fileId} not found`);
  }

  try {
    // Simulate onchain publishing by having a delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error(`Failed to publish file ${fileId}:`, error);
    throw error;
  }
}
