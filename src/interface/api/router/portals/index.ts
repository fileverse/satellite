import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import { addPortal, addKey, removeKey } from '../../handlers/portals';

const router = Router();

router.post('/', asyncHandlerArray(addPortal));
router.post('/apikey', asyncHandlerArray(addKey));
router.delete('/apikey', asyncHandlerArray(removeKey));

export default router;
