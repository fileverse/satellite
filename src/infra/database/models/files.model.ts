import { QueryBuilder } from '../query-builder';

export interface File {
  _id: string;
  onchainFileId: number;
  ddocId: string;
  title: string;
  portalAddress: string;
  metadataIPFSHash: string;
  contentIPFSHash: string;
  gateIPFSHash: string;
  contentDecrypted?: string;
  isDeleted: boolean;
  folderRef?: string; // Optional - for folder relationship
  lastTransactionHash?: string;
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
  createdBlockTimestamp: number;
  created_at: string;
  updated_at: string;
}

export interface FileListResponse {
  ddocs: File[];
  total: number;
  hasNext: boolean;
}

export class FilesModel {
  private static readonly TABLE = 'files';

  static findAll(limit?: number, skip?: number): { files: File[]; total: number; hasNext: boolean } {
    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM ${this.TABLE} WHERE isDeleted = 0`;
    const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql);
    const total = totalResult?.count || 0;

    // Get paginated results
    const sql = QueryBuilder.paginate(
      `SELECT 
        _id, onchainFileId, ddocId, title, portalAddress, metadataIPFSHash, 
        contentIPFSHash, gateIPFSHash, contentDecrypted, isDeleted, folderRef,
        lastTransactionHash, lastTransactionBlockNumber, lastTransactionBlockTimestamp, 
        createdBlockTimestamp, created_at, updated_at
      FROM ${this.TABLE} 
      WHERE isDeleted = 0`,
      { 
        limit, 
        offset: skip, 
        orderBy: 'created_at', 
        orderDirection: 'DESC' 
      }
    );
    
    const filesRaw = QueryBuilder.select<any>(sql);
    const files = filesRaw.map(file => ({
      ...file,
      isDeleted: Boolean(file.isDeleted)
    }));
    const hasNext = skip !== undefined && limit !== undefined ? (skip + limit) < total : false;

    return { files, total, hasNext };
  }

  static findByDDocId(ddocId: string): File | undefined {
    const sql = `SELECT 
      _id, onchainFileId, ddocId, title, portalAddress, metadataIPFSHash, 
      contentIPFSHash, gateIPFSHash, contentDecrypted, isDeleted, folderRef,
      lastTransactionHash, lastTransactionBlockNumber, lastTransactionBlockTimestamp, 
      createdBlockTimestamp, created_at, updated_at
    FROM ${this.TABLE} WHERE ddocId = ? AND isDeleted = 0`;
    const fileRaw = QueryBuilder.selectOne<any>(sql, [ddocId]);
    if (!fileRaw) return undefined;
    
    return {
      ...fileRaw,
      isDeleted: Boolean(fileRaw.isDeleted)
    };
  }

  static findByFolderRef(folderRef: string, limit?: number, skip?: number): File[] {
    const sql = QueryBuilder.paginate(
      `SELECT 
        _id, onchainFileId, ddocId, title, portalAddress, metadataIPFSHash, 
        contentIPFSHash, gateIPFSHash, contentDecrypted, isDeleted, folderRef,
        lastTransactionHash, lastTransactionBlockNumber, lastTransactionBlockTimestamp, 
        createdBlockTimestamp, created_at, updated_at
      FROM ${this.TABLE} 
      WHERE folderRef = ? AND isDeleted = 0`,
      { 
        limit, 
        offset: skip, 
        orderBy: 'created_at', 
        orderDirection: 'DESC' 
      }
    );
    const filesRaw = QueryBuilder.select<any>(sql, [folderRef]);
    return filesRaw.map(file => ({
      ...file,
      isDeleted: Boolean(file.isDeleted)
    }));
  }

  /**
   * Search files by title (case-insensitive substring match)
   */
  static searchByTitle(searchTerm: string, limit?: number, skip?: number): File[] {
    const sql = QueryBuilder.paginate(
      `SELECT 
        _id, onchainFileId, ddocId, title, portalAddress, metadataIPFSHash, 
        contentIPFSHash, gateIPFSHash, contentDecrypted, isDeleted, folderRef,
        lastTransactionHash, lastTransactionBlockNumber, lastTransactionBlockTimestamp, 
        createdBlockTimestamp, created_at, updated_at
      FROM ${this.TABLE} 
      WHERE isDeleted = 0 AND LOWER(title) LIKE LOWER(?)`,
      { 
        limit, 
        offset: skip, 
        orderBy: 'created_at', 
        orderDirection: 'DESC' 
      }
    );
    
    const filesRaw = QueryBuilder.select<any>(sql, [`%${searchTerm}%`]);
    return filesRaw.map(file => ({
      ...file,
      isDeleted: Boolean(file.isDeleted)
    }));
  }

  /**
   * Create a new file
   */
  static create(input: {
    _id?: string;
    onchainFileId: number;
    ddocId: string;
    title: string;
    portalAddress: string;
    metadataIPFSHash: string;
    contentIPFSHash: string;
    gateIPFSHash: string;
    contentDecrypted?: string;
    folderRef?: string;
    lastTransactionHash?: string;
    lastTransactionBlockNumber: number;
    lastTransactionBlockTimestamp: number;
    createdBlockTimestamp: number;
  }): File {
    const _id = input._id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.TABLE} (
      _id, onchainFileId, ddocId, title, portalAddress, metadataIPFSHash,
      contentIPFSHash, gateIPFSHash, contentDecrypted, isDeleted, folderRef,
      lastTransactionHash, lastTransactionBlockNumber, lastTransactionBlockTimestamp, createdBlockTimestamp,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    QueryBuilder.execute(sql, [
      _id,
      input.onchainFileId,
      input.ddocId,
      input.title,
      input.portalAddress,
      input.metadataIPFSHash,
      input.contentIPFSHash,
      input.gateIPFSHash,
      input.contentDecrypted || null,
      0, // isDeleted
      input.folderRef || null,
      input.lastTransactionHash || null,
      input.lastTransactionBlockNumber,
      input.lastTransactionBlockTimestamp,
      input.createdBlockTimestamp,
      now,
      now
    ]);

    const created = this.findByDDocId(input.ddocId);
    if (!created) {
      throw new Error('Failed to create file');
    }
    return created;
  }
}
