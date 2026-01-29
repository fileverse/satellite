/**
 * Internal type for updating files in the database.
 * Includes all fields that can be updated in a file record.
 */
export interface UpdateFilePayload {
  title?: string;
  content?: string;
  isDeleted?: number;
  localVersion?: number;
  onchainVersion?: number;
  syncStatus?: 'pending' | 'synced' | 'failed';
  portalAddress?: string;
  metadata?: Record<string, unknown>;
  onChainFileId?: number;
}

