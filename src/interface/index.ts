import { Router } from "express";
import ddocsRouter from "./api/router/ddocs";
import foldersRouter from "./api/router/folders";
import searchRouter from "./api/router/search";
import eventsRouter from "./api/router/events";
import { apiKeyAuth } from "./middleware";

const router = Router();

router.use("/api/ddocs", apiKeyAuth, ddocsRouter);
router.use("/api/folders", apiKeyAuth, foldersRouter);
router.use("/api/search", apiKeyAuth, searchRouter);
router.use("/api/events", apiKeyAuth, eventsRouter);

export default router;
