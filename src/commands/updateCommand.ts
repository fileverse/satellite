import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { Command } from 'commander';
import { updateFile, getFile, UpdateFileInput } from '../domain/file';
import { spawnSync } from 'child_process';
import Table from 'cli-table3';
import { formatDate, getElapsedTime, columnNames, columnWidth } from './utils/util';

function showTable(updatedFile: any) {
  const table = new Table({
    head: [columnNames.ddocId, columnNames.title, columnNames.status, columnNames.local, columnNames.onchain, columnNames.created, columnNames.lastModified],
    colWidths: [
      columnWidth[columnNames.ddocId],
      columnWidth[columnNames.title],
      columnWidth[columnNames.status],
      columnWidth[columnNames.local],
      columnWidth[columnNames.onchain],
      columnWidth[columnNames.created],
      columnWidth[columnNames.lastModified],
    ],
    style: { head: [] },
  });

  const fileDdocId = (updatedFile as any).ddocId || 'N/A';
  table.push([
    fileDdocId,
    updatedFile.title.length > 23 ? updatedFile.title.substring(0, 20) + '...' : updatedFile.title,
    updatedFile.syncStatus,
    updatedFile.localVersion,
    updatedFile.onchainVersion,
    formatDate(updatedFile.createdAt),
    getElapsedTime(updatedFile.updatedAt),
  ]);

  console.log(table.toString());
}

export const updateCommand = new Command()
  .name('update')
  .description('Update an existing ddoc from a file')
  .argument('<ddocId>', 'The ddoc ID to update')
  .option('-f, --file <file_path>', 'path to file to update ddoc from')
  .action(async (
    ddocId: string,
    options: { file?: string }
  ) => {
    try {
      const file = await getFile(ddocId);
      if (!file) {
        throw new Error(`ddoc with ${ddocId} not found.`);
      }

      const filePath = options?.file ?? '';
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content || content.trim().length === 0) {
          throw new Error(`file content cannot be empty`);
        }

        const title = path.basename(filePath);
        const payload: UpdateFileInput = {
          title,
          content,
        };
        const updatedFile = await updateFile(ddocId, payload);
        console.log('\n✓ Ddoc updated successfully!\n');
        showTable(updatedFile);
        return;
      }

      // vi-editor flow
      const tmpFilePath = path.join(os.tmpdir(), `tmp-${ddocId}-${Date.now()}.txt`);
      fs.writeFileSync(tmpFilePath, file.content);

      const editor = process.env.EDITOR || 'vi';
      const result = spawnSync(editor, [tmpFilePath], { stdio: 'inherit' });
      if (result.status === 0) {
        const newContent = fs.readFileSync(tmpFilePath, 'utf-8');
        if (newContent === file.content) {
          console.log(`No changes made. Update cancelled.`);
          fs.unlinkSync(tmpFilePath);
          return;
        }

        const payload: UpdateFileInput = {
          title: file.title, // keeping same title as current
          content: newContent,
        };
        const updatedFile = await updateFile(ddocId, payload);
        console.log('\n✓ Ddoc updated successfully!\n');
        showTable(updatedFile);
      }

      fs.unlinkSync(tmpFilePath);
    } catch (error: any) {
      console.error('Error updating ddoc:', error.message);
      throw error;
    }
  });

