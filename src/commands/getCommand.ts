import { Command } from 'commander';
import Table from 'cli-table3';
import { getFile } from '../domain/file';
import { formatDate, getElapsedTime, columnNames, columnWidth } from './utils/util';

export const getCommand = new Command()
	.name('get')
	.description('Get a ddoc by its ID')
	.argument('<ddocId>', 'The ddoc ID to retrieve')
	.action(async (ddocId: string) => {
		try {
			const file = getFile(ddocId);
			if (!file) {
				console.error(`Ddoc with ID "${ddocId}" not found.`);
				return;
			}

			const table = new Table({
				head: [columnNames.ddocId, columnNames.title, columnNames.status, columnNames.local, columnNames.onchain, columnNames.deleted, columnNames.created, columnNames.lastModified],
				colWidths: [
					columnWidth[columnNames.ddocId],
					columnWidth[columnNames.title],
					columnWidth[columnNames.status],
					columnWidth[columnNames.local],
					columnWidth[columnNames.onchain],
					columnWidth[columnNames.deleted],
					columnWidth[columnNames.created],
					columnWidth[columnNames.lastModified],
				],
				style: { head: [] },
			});

			const fileDdocId = (file as any).ddocId || 'N/A';
			table.push([
				fileDdocId,
				file.title.length > 23 ? file.title.substring(0, 20) + '...' : file.title,
				file.syncStatus,
				file.localVersion,
				file.onchainVersion,
				file.isDeleted ? 'True' : 'False',
				formatDate(file.createdAt),
				getElapsedTime(file.updatedAt),
			]);

			console.log('\nDdoc details:\n');
			console.log(table.toString());
		} catch (error: any) {
			console.error('Error getting ddoc:', error.message);
			throw error;
		}
	});

