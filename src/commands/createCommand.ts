import { Command } from 'commander';
import { createFile } from '../domain/file';
import * as fs from 'fs';
import * as path from 'path';
import Table from 'cli-table3';
import { formatDate, getElapsedTime, columnNames, columnWidth } from './utils/util';

export const createCommand = new Command()
	.name('create')
	.description('Create a new ddoc from a file')
	.argument('<filepath>', 'Path to the file to create ddoc from')
	.action(async (filepath: string) => {
		try {
			if (!fs.existsSync(filepath)) {
				throw new Error(`File not found: ${filepath}`);
			}

			const content = fs.readFileSync(filepath, 'utf-8');
			if (!content || content.trim().length === 0) {
				throw new Error('File content cannot be empty');
			}

			const title = path.basename(filepath);
			const file = await createFile({ title, content });

			console.log('\nDdoc created successfully!\n');
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

			const ddocId = (file as any).ddocId || 'N/A';
			table.push([
				ddocId,
				file.title.length > 23 ? file.title.substring(0, 20) + '...' : file.title,
				file.syncStatus,
				file.localVersion,
				file.onchainVersion,
				formatDate(file.createdAt),
				getElapsedTime(file.updatedAt),
			]);

			console.log(table.toString());
		} catch (error: any) {
			console.error('Error creating ddoc:', error.message);
			throw error;
		}
	});

