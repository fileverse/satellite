import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import list from './list';
import get from './get';
import create from './create';

const router = Router();

router.get('/', asyncHandlerArray(list));
router.post('/', asyncHandlerArray(create));
router.get('/:folderRef/:folderId', asyncHandlerArray(get));

export default router;
