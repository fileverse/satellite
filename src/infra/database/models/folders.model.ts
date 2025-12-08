import { QueryBuilder } from '../query-builder';
import { File } from './files.model';

/**
 * Folder model interface
 * Based on API spec
 */
export interface Folder {
  _id: string; // Internal ID (can be auto-generated)
  folderId: string;
  folderRef: string;
  folderName: string; // Name of the folder for search
  portalAddress: string;
  metadataIPFSHash: string;
  resolvedMetadata?: {
    name: string;
    description?: string;
  }; // JSON field - stored as TEXT in SQLite
  isDeleted: boolean;
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
  created_at: string;
  updated_at: string;
}

export interface FolderWithDDocs extends Folder {
  ddocs: File[];
}

export interface FolderListResponse {
  folders: Folder[];
  total: number;
  hasNext: boolean;
}

export class FoldersModel {
  private static readonly TABLE = 'folders';

  /**
   * List all folders with pagination
   */
  static findAll(limit?: number, skip?: number): { folders: Folder[]; total: number; hasNext: boolean } {
    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM ${this.TABLE} WHERE isDeleted = 0`;
    const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql);
    const total = totalResult?.count || 0;

    // Get paginated results
    const sql = QueryBuilder.paginate(
      `SELECT * FROM ${this.TABLE} WHERE isDeleted = 0`,
      { 
        limit, 
        offset: skip, 
        orderBy: 'created_at', 
        orderDirection: 'DESC' 
      }
    );
    
    const folders = QueryBuilder.select<any>(sql).map(folderRaw => ({
      ...folderRaw,
      resolvedMetadata: folderRaw.resolvedMetadata 
        ? (typeof folderRaw.resolvedMetadata === 'string' 
            ? JSON.parse(folderRaw.resolvedMetadata) 
            : folderRaw.resolvedMetadata)
        : undefined,
      isDeleted: Boolean(folderRaw.isDeleted)
    }));

    const hasNext = skip !== undefined && limit !== undefined ? (skip + limit) < total : false;

    return { folders, total, hasNext };
  }

  /**
   * Get a single folder by folderRef and folderId
   * Includes ddocs array (as per API spec)
   */
  static findByFolderRefAndId(folderRef: string, folderId: string): FolderWithDDocs | undefined {
    const sql = `SELECT * FROM ${this.TABLE} WHERE folderRef = ? AND folderId = ? AND isDeleted = 0`;
    const folderRaw = QueryBuilder.selectOne<any>(sql, [folderRef, folderId]);
    
    if (!folderRaw) {
      return undefined;
    }

    // Parse resolvedMetadata JSON (SQLite stores JSON as TEXT)
    const parsedFolder: Folder = {
      ...folderRaw,
      resolvedMetadata: folderRaw.resolvedMetadata 
        ? (typeof folderRaw.resolvedMetadata === 'string' 
            ? JSON.parse(folderRaw.resolvedMetadata) 
            : folderRaw.resolvedMetadata)
        : undefined,
      isDeleted: Boolean(folderRaw.isDeleted)
    };

    // Get ddocs in this folder
    // Import at runtime to avoid circular dependency
    const { FilesModel } = require('./files.model');
    const ddocs = FilesModel.findByFolderRef(folderRef);

    return {
      ...parsedFolder,
      ddocs
    };
  }

  /**
   * Get folder by folderRef only
   */
  static findByFolderRef(folderRef: string): Folder | undefined {
    const sql = `SELECT * FROM ${this.TABLE} WHERE folderRef = ? AND isDeleted = 0 LIMIT 1`;
    const folderRaw = QueryBuilder.selectOne<any>(sql, [folderRef]);
    
    if (!folderRaw) {
      return undefined;
    }

    return {
      ...folderRaw,
      resolvedMetadata: folderRaw.resolvedMetadata 
        ? (typeof folderRaw.resolvedMetadata === 'string' 
            ? JSON.parse(folderRaw.resolvedMetadata) 
            : folderRaw.resolvedMetadata)
        : undefined,
      isDeleted: Boolean(folderRaw.isDeleted)
    };
  }

  /**
   * Search folders by folderName (case-insensitive substring match)
   */
  static searchByName(searchTerm: string, limit?: number, skip?: number): Folder[] {
    const sql = QueryBuilder.paginate(
      `SELECT * FROM ${this.TABLE} 
       WHERE isDeleted = 0 AND LOWER(folderName) LIKE LOWER(?)`,
      { 
        limit, 
        offset: skip, 
        orderBy: 'created_at', 
        orderDirection: 'DESC' 
      }
    );
    
    const foldersRaw = QueryBuilder.select<any>(sql, [`%${searchTerm}%`]);
    return foldersRaw.map(folderRaw => ({
      ...folderRaw,
      resolvedMetadata: folderRaw.resolvedMetadata 
        ? (typeof folderRaw.resolvedMetadata === 'string' 
            ? JSON.parse(folderRaw.resolvedMetadata) 
            : folderRaw.resolvedMetadata)
        : undefined,
      isDeleted: Boolean(folderRaw.isDeleted)
    }));
  }

  /**
   * Create a new folder
   */
  static create(input: {
    _id?: string;
    folderId: string;
    folderRef: string;
    folderName: string;
    portalAddress: string;
    metadataIPFSHash: string;
    resolvedMetadata?: {
      name: string;
      description?: string;
    };
    lastTransactionBlockNumber: number;
    lastTransactionBlockTimestamp: number;
  }): Folder {
    const _id = input._id || `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.TABLE} (
      _id, folderId, folderRef, folderName, portalAddress, metadataIPFSHash,
      resolvedMetadata, isDeleted, lastTransactionBlockNumber, 
      lastTransactionBlockTimestamp, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    QueryBuilder.execute(sql, [
      _id,
      input.folderId,
      input.folderRef,
      input.folderName,
      input.portalAddress,
      input.metadataIPFSHash,
      input.resolvedMetadata ? JSON.stringify(input.resolvedMetadata) : null,
      0, // isDeleted
      input.lastTransactionBlockNumber,
      input.lastTransactionBlockTimestamp,
      now,
      now
    ]);

    // Fetch the created folder (without ddocs)
    const selectSql = `SELECT * FROM ${this.TABLE} WHERE folderRef = ? AND folderId = ? AND isDeleted = 0`;
    const folderRaw = QueryBuilder.selectOne<any>(selectSql, [input.folderRef, input.folderId]);
    
    if (!folderRaw) {
      throw new Error('Failed to create folder');
    }

    return {
      ...folderRaw,
      resolvedMetadata: folderRaw.resolvedMetadata 
        ? (typeof folderRaw.resolvedMetadata === 'string' 
            ? JSON.parse(folderRaw.resolvedMetadata) 
            : folderRaw.resolvedMetadata)
        : undefined,
      isDeleted: Boolean(folderRaw.isDeleted)
    };
  }
}
