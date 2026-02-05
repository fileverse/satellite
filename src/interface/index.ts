import { Router } from 'express';
import ddocsRouter from './api/router/ddocs';
import foldersRouter from './api/router/folders';
import searchRouter from './api/router/search';
import activityRouter from './api/router/activity';

const router = Router();

router.use('/api/ddocs', ddocsRouter);
router.use('/api/folders', foldersRouter);
router.use('/api/search', searchRouter);
router.use('/api/activity', activityRouter);


export default router;
