import { Response } from 'express';
import {
  CreateFileInput,
  GetFileParams,
  ListFilesParams,
  ListFilesResult,
  UpdateFileInput,
} from '../../../../domain/file';
import { FileEntity } from '../../../../domain/file/FileEntity';
import { FileService } from '../../../../domain/file/FileService';
import { successResponse } from '../../responses';
import { BadRequestError, NotFoundError } from '../../../../errors';
import { createMiddleware, updateMiddleware } from './customMiddlewares';
import { extractTitleAndContent } from './helper';
import type { DdocsRequest } from '../../middleware/ddocsContainer';

const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_SKIP_COUNT = 0;

const listHandler = async (req: DdocsRequest, res: Response) => {
  const svc = req.context.fileService;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_LIST_LIMIT;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : DEFAULT_SKIP_COUNT;
  const portalAddress = req.headers['x-portal-address'] as string | undefined;

  if (!portalAddress) {
    throw new BadRequestError('Missing required header: x-portal-address is required');
  }

  const params: ListFilesParams = { skip, limit, portalAddress };
  const result: ListFilesResult = await svc.list(params);
  return successResponse(res, 200, 'OK', result);
};

const getHandler = async (req: DdocsRequest, res: Response) => {
  const svc: FileService = req.context.fileService;
  const { ddocId } = req.params;
  if (!ddocId) {
    throw new BadRequestError('ddocId is missing');
  }

  const portalAddress = req.headers['x-portal-address'] as string | undefined;
  if (!portalAddress) {
    throw new BadRequestError('Missing required header: x-portal-address is required');
  }

  const params: GetFileParams = { ddocId, portalAddress };
  const result: FileEntity | null = await svc.get(params);
  if (result === null) {
    throw new NotFoundError('File not found');
  }

  return successResponse(res, 200, 'OK', result);
};

const createHandler = async (req: DdocsRequest, res: Response) => {
  const svc = req.context.fileService;
  const { title, fileContent } = extractTitleAndContent(req);
  if (!title) {
    throw new BadRequestError('title is missing');
  }
  if (!fileContent) {
    throw new BadRequestError('file content is empty');
  }

  const portalAddress = req.headers['x-portal-address'] as string | undefined;
  if (!portalAddress) {
    throw new BadRequestError('missing required header: x-portal-address is required');
  }

  const payload: CreateFileInput = {
    title,
    content: fileContent,
    portalAddress,
  };
  const file: FileEntity = await svc.create(payload);
  return successResponse(
    res,
    201,
    'File created successfully. On-chain publishing is pending.',
    file,
  );
};

const updateHandler = async (req: DdocsRequest, res: Response) => {
  const svc = req.context.fileService;
  const { ddocId } = req.params;
  const { title, fileContent } = extractTitleAndContent(req);
  if (title !== undefined && title.trim().length === 0) {
    throw new BadRequestError('title cannot be empty');
  }

  const portalAddress = req.headers['x-portal-address'] as string | undefined;
  if (!portalAddress) {
    throw new BadRequestError('Missing required header: x-portal-address is required');
  }

  const payload: UpdateFileInput = { title, content: fileContent };
  const file: FileEntity = await svc.update(ddocId, portalAddress, payload);
  return successResponse(res, 200, 'File updated successfully', file);
};

const deleteHandler = async (req: DdocsRequest, res: Response) => {
  const svc: FileService = req.context.fileService;
  const { ddocId } = req.params;
  if (!ddocId) {
    throw new BadRequestError('ddocId is required');
  }

  const portalAddress = req.headers['x-portal-address'] as string | undefined;
  if (!portalAddress) {
    throw new BadRequestError('Missing required header: x-portal-address is required');
  }

  const params: GetFileParams = { ddocId, portalAddress };
  await svc.delete(params);
  return successResponse(res, 200, 'File deleted successfully');
};

export const create = [createMiddleware, createHandler];
export const update = [updateMiddleware, updateHandler];
export const list = [listHandler];
export const get = [getHandler];
export const del = [deleteHandler];
