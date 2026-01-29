import { Request, Response, NextFunction } from 'express';
import { PortalService } from '../../../domain/portal/PortalService';
import { ApiKeyService } from '../../../domain/portal/ApiKeyService';
import { SqliteExecutor } from '../../../infra/database/executor/SqliteExecutor';
import { PortalsRepository } from '../../../infra/database/repositories/PortalsRepository';
import { ApiKeysRepository } from '../../../infra/database/repositories/ApiKeysRepository';
import { databaseConnectionManager } from '../../../infra/database/connection';

export type PortalsRequest = Request & {
  context: {
    portalService: PortalService;
    apiKeyService: ApiKeyService;
  };
};

export function portalsContainerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const db = databaseConnectionManager.getConnection();
  const executor = new SqliteExecutor(db);
  const portalsRepository = new PortalsRepository(executor);
  const apiKeysRepository = new ApiKeysRepository(executor);

  (req as PortalsRequest).context = {
    portalService: new PortalService(portalsRepository),
    apiKeyService: new ApiKeyService(apiKeysRepository, portalsRepository),
  };

  next();
}
