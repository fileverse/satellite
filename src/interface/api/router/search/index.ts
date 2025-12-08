import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra/asyncHandler';
import search from './search';

const router = Router();

router.get('/', asyncHandlerArray(search));

export default router;
