import { Command } from 'commander';
import { updateFile, UpdateFileInput } from '../domain/file';
import * as fs from 'fs';
import * as path from 'path';
import Table from 'cli-table3';
import { formatDate, getElapsedTime, columnNames, columnWidth } from './utils/util';

export const updateCommand = new Command()
	.name('update')
	.description('Update an existing ddoc from a file')
	.argument('<ddocId>', 'The ddoc ID to update')
	.requiredOption('-f, --file <filepath>', 'Path to the file to update ddoc from')
	.action(async (ddocId: string, options: { file: string }) => {
		try {
			if (!fs.existsSync(options.file)) {
				throw new Error(`File not found: ${options.file}`);
			}

			const content = fs.readFileSync(options.file, 'utf-8');
			if (!content || content.trim().length === 0) {
				throw new Error('File content cannot be empty');
			}

			const title = path.basename(options.file);
			const payload: UpdateFileInput = {
				title,
				content,
			};
			const updatedFile = await updateFile(ddocId, payload);

			console.log('\n✓ Ddoc updated successfully!\n');
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
		} catch (error: any) {
			console.error('Error updating ddoc:', error.message);
			throw error;
		}
	});

