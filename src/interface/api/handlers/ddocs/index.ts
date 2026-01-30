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

const createHandler = async (req: Request, res: Response) => {
  try {
    const { title, fileContent } = extractTitleAndContent(req);
    // TODO: Extract portalAddress from auth header once authentication is implemented
    const portalAddress = req.headers['x-portal-address'] as string | undefined;

    if (!title) {
      return res.status(400).json({
        error: 'Missing required field: title is required. When uploading a file, title is derived from the file name. When providing content directly, title must be provided.'
      });
    }

    if (!fileContent) {
      return res.status(400).json({
        error: 'Missing content: Either provide a file upload or fileContent text field'
      });
    }

    if (!portalAddress) {
      return res.status(400).json({
        error: 'Missing required header: x-portal-address is required'
      });
    }

    const payload: CreateFileInput = {
      title: title,
      content: fileContent,
      portalAddress,
    };

    const file = await createFile(payload);
    res.status(201).json({
      message: 'File created successfully. Sync to on-chain is pending.',
      data: { ...file },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
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
    return res
      .status(200)
      .json({
        message: 'file updated successfully',
        data: file.toResponse(), // TODO: check if we can remove the toResponse()
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

