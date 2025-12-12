import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import { list, get, create, update, del } from '../../handlers/ddocs';

const router = Router();

router.post('/', asyncHandlerArray(create));
router.get('/', asyncHandlerArray(list));
router.get('/:ddocId', asyncHandlerArray(get));
router.put('/:ddocId', asyncHandlerArray(update));
router.delete('/:ddocId', asyncHandlerArray(del));

export default router;
