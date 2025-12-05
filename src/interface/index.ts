import { Router } from 'express';
import ddocsRouter from './api/router/ddocs';
import foldersRouter from './api/router/folders';

const router = Router();

router.use('/api/ddocs', ddocsRouter);
router.use('/api/folders', foldersRouter);

export default router;
