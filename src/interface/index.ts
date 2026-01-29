import { Router } from 'express';
import ddocsRouter from './api/router/ddocs';
// import searchRouter from './api/router/search';
import portalsRouter from './api/router/portals';

const router = Router();

router.use('/api/ddocs', ddocsRouter);
// router.use('/api/search', searchRouter);
router.use('/api/portals', portalsRouter);

export default router;
