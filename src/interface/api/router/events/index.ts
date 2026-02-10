import { Router } from "express";
import { asyncHandlerArray } from "../../../../infra";
import listFailed from "./listFailed";
import retryOne from "./retryOne";
import retryAllFailed from "./retryAllFailed";

const router = Router();

router.get("/failed", asyncHandlerArray(listFailed));
router.post("/retry-failed", asyncHandlerArray(retryAllFailed));
router.post("/:id/retry", asyncHandlerArray(retryOne));

export default router;
