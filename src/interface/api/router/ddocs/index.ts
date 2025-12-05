import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra/asyncHandler';
import list from './list';
import create from './create';
import update from './update';
import get from './get';
import remove from './remove';

const router = Router();

router.get('/', asyncHandlerArray(list));
router.post('/', asyncHandlerArray(create));
router.put('/:ddocId', asyncHandlerArray(update));
router.get('/:ddocId', asyncHandlerArray(get));
router.delete('/:ddocId', asyncHandlerArray(remove));

export default router;
