export interface FileEvent {
  fileId: string;
  type: 'create' | 'update' | 'delete';
  metadata: Record<string, any>;
}

export const FILE_EVENTS_QUEUE = 'file-events';

