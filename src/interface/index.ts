import { Router } from 'express';
import ddocsRouter from './api/router/ddocs';
import foldersRouter from './api/router/folders';
import searchRouter from './api/router/search';

const router = Router();

router.use('/api/ddocs', ddocsRouter);
router.use('/api/folders', foldersRouter);
router.use('/api/search', searchRouter);

export default router;
