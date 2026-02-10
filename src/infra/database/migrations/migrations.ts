export interface MigrationFile {
  timestamp: string;
  name: string;
  up: string;
  down?: string;
}

export const migrations: MigrationFile[] = [];
