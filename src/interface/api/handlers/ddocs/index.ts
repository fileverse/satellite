import { Request, Response } from 'express';
import { listFiles, getFile, createFile, updateFile, deleteFile, CreateFileInput, UpdateFileInput } from '../../../../domain/file';
import type { DdocsRequest } from '../../middleware/ddocsContainer';
import { createMiddleware, updateMiddleware } from './customMiddlewares';
import { extractTitleAndContent } from './helper';
import { ClientUpdateFileInput } from './types';
import { FileEntity } from '../../../../domain/file/FileEntity';

const listHandler = async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  const portalAddress = req.headers['x-portal-address'] as string | undefined;

  if (!portalAddress) {
    return res.status(400).json({ error: 'Missing required header: x-portal-address is required' });
  }

  const result = listFiles({ limit, skip, portalAddress });

  res.json({
    ddocs: result.ddocs,
    total: result.total,
    hasNext: result.hasNext
  });
};

const getHandler = async (req: Request, res: Response) => {
  const { ddocId } = req.params;
  const portalAddress = req.headers['x-portal-address'] as string | undefined;

  if (!ddocId) {
    return res.status(400).json({ error: 'ddocId is required' });
  }

  if (!portalAddress) {
    return res.status(400).json({ error: 'Missing required header: x-portal-address is required' });
  }

  try {
    const file = getFile(ddocId, portalAddress);

    if (!file) {
      return res.status(404).json({ error: 'DDoc not found' });
    }

    res.json(file);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

const createHandler = async (req: DdocsRequest, res: Response) => {
  try {
    const svc = req.context.fileService;
    const { title, fileContent } = extractTitleAndContent(req);
    if (!title) {
      return res.status(400).json({
        error: 'title is missing'
      });
    }
    if (!fileContent) {
      return res.status(400).json({
        error: 'file content is empty'
      });
    }

    const portalAddress = req.headers['x-portal-address'] as string | undefined;
    if (!portalAddress) {
      return res.status(400).json({
        error: 'missing required header: x-portal-address is required'
      });
    }

    const payload: CreateFileInput = {
      title,
      content: fileContent,
      portalAddress,
    };
    const file: FileEntity = await svc.create(payload);
    res.status(201)
      .json({
        message: 'File created successfully. On-chain publishing is penging.',
        data: file, // TODO: check if response needs any formatting, if not remove toResponse function used by update logic.
      });
  } catch (error: any) {
    return res.status(500).json({ error: `Something went wrong: ${error}.` });
  }
};

const updateHandler = async (req: DdocsRequest, res: Response) => {
  // Flow: Handler → FileService → FilesRepository → SqliteExecutor
  try {
    const svc = req.context.fileService;
    const { ddocId } = req.params;
    const { title, fileContent } = extractTitleAndContent(req);

    const portalAddress = req.headers['x-portal-address'] as string | undefined;
    if (!portalAddress) {
      return res.status(400).json({ error: 'Missing required header: x-portal-address is required' });
    }

    const payload: UpdateFileInput = {
      title,
      content: fileContent
    };
    const file: FileEntity = await svc.update(ddocId, portalAddress, payload);
    res.status(200)
      .json({
        message: 'file updated successfully',
        data: file,
      });
  } catch (error: unknown) {
    // TODO: do better
    const message = error instanceof Error ? error.message : 'Update failed';
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
}

const deleteHandler = async (req: Request, res: Response) => {
  try {
    const { ddocId } = req.params;
    const portalAddress = req.headers['x-portal-address'] as string | undefined;

    if (!ddocId) {
      return res.status(400).json({ error: 'ddocId is required' });
    }

    if (!portalAddress) {
      return res.status(400).json({ error: 'Missing required header: x-portal-address is required' });
    }

    const result = await deleteFile(ddocId, portalAddress);
    res.status(200).json({
      message: 'File deleted successfully',
      data: { ...result },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const create = [createMiddleware, createHandler];
export const update = [updateMiddleware, updateHandler];
export const list = [listHandler];
export const get = [getHandler];
export const del = [deleteHandler];

