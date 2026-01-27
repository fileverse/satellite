import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import { addPortal, addKey } from '../../handlers/portals';

const router = Router();

router.post('/', asyncHandlerArray(addPortal));
router.post('/apikey', asyncHandlerArray(addKey));

export default router;
