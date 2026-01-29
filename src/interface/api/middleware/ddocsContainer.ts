import { Request, Response, NextFunction } from "express";
import type { FileService } from "../../../domain/file/FileService";
import { databaseConnectionManager } from "../../../infra/database/connection";
import { SqliteExecutor } from "../../../infra/database/executor/SqliteExecutor";
import { FilesRepository } from "../../../infra/database/repositories/FilesRepository";
import { FileService as FileServiceClass } from "../../../domain/file/FileService";
import { fileEventsQueue } from "../../../infra/queue";

/**
 * Request that has gone through ddocsContainerMiddleware.
 * Use this type in handlers that need FileService (e.g. update).
 */
export type DdocsRequest = Request & {
  container: {
    fileService: FileService;
  };
};

const db = databaseConnectionManager.getConnection();
const executor = new SqliteExecutor(db);
const filesRepository = new FilesRepository(executor);

/**
 * Attaches request-scoped dependencies for ddocs routes (FileService, etc.).
 * After this middleware, req.container.fileService is available.
 * Use DdocsRequest in handlers that need it.
 */
export function ddocsContainerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  (req as DdocsRequest).container = {
    fileService: new FileServiceClass(filesRepository, fileEventsQueue),
  };
  next();
}
