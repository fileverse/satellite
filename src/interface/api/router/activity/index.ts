import { Router } from 'express';
import { asyncHandlerArray } from '../../../../infra';
import { list } from '../../handlers/activity';

const router = Router();

router.get('/', asyncHandlerArray(list));

export default router;
