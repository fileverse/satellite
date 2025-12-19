/**
 * Client-facing type for updating files.
 * Only allows updating title and content - nothing else.
 */
export interface ClientUpdateFileInput {
  title?: string;
  content?: string;
}

