import { validateDbConfig } from "./config";
import { logger } from "./infra";
import { runMigrations } from "./infra/database/migrations";
import { closeWorker, isWorkerActive, startWorker } from "./appWorker";

const main = async () => {
  validateDbConfig();
  await runMigrations();

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);
  await startWorker(concurrency);

  setTimeout(() => {
    if (isWorkerActive()) {
      logger.info("File events worker started and active");
      return;
    }

    logger.error("Worker failed to start");
    process.exit(1);
  }, 100);
};

main().catch((error) => {
  logger.error("Failed to start worker:", error);
  process.exit(1);
});

const shutdown = async () => {
  logger.info("Shutting down worker gracefully...");
  await closeWorker();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
