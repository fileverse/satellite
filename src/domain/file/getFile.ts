import { FilesModel } from '../../infra/database/models/files.model';
import { File } from '../../infra/database/models/files.model';

/**
 * Domain function to get a single file/ddoc by ddocId
 * Business logic layer - handles file retrieval operations
 */
export default function getFile(ddocId: string): File | null {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  const file = FilesModel.findByDDocId(ddocId);
  
  if (!file) {
    return null;
  }

  return file;
}
