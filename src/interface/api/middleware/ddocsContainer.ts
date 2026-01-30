import { Request, Response, NextFunction } from "express";
import type { FileService } from "../../../domain/file/FileService";
import { databaseConnectionManager } from "../../../infra/database/connection";
import { SqliteExecutor } from "../../../infra/database/executor/SqliteExecutor";
import { FilesRepository } from "../../../infra/database/repositories/FilesRepository";
import { FileService as FileServiceClass } from "../../../domain/file/FileService";
import { fileEventsQueue } from "../../../infra/queue";

export type DdocsRequest = Request & {
  context: {
    fileService: FileService;
  };
};

export function ddocsContainerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const db = databaseConnectionManager.getConnection();
  const executor = new SqliteExecutor(db);
  const filesRepository = new FilesRepository(executor);

  (req as DdocsRequest).context = {
    fileService: new FileServiceClass(filesRepository, fileEventsQueue),
  };

  next();
}
