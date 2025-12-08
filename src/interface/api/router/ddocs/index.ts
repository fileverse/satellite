import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra/asyncHandler';
import list from './list';
import get from './get';
import create from './create';

const router = Router();

router.get('/', asyncHandlerArray(list));
router.post('/', asyncHandlerArray(create));
router.get('/:ddocId', asyncHandlerArray(get));

export default router;
