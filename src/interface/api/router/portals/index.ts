import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import { portalsContainerMiddleware } from '../../middleware/portalsContainer';
import { addPortal, addKey, removeKey } from '../../handlers/portals';

const router = Router();

router.use(portalsContainerMiddleware);

router.post('/', asyncHandlerArray(addPortal));
router.post('/apikey', asyncHandlerArray(addKey));
router.delete('/apikey/:id', asyncHandlerArray(removeKey));

export default router;
