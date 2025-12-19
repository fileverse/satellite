import { Command } from 'commander';
import Table from 'cli-table3';
import { listFiles } from '../domain/file';
import { formatDate, getElapsedTime, columnNames, columnWidth } from './utils/util';

export const listCommand = new Command()
	.name('list')
	.description('List all ddocs')
	.option('-l, --limit <number>', 'Limit the number of results', parseInt)
	.option('-s, --skip <number>', 'Skip the first N results', parseInt)
	.action(async (options) => {
		try {
			const params = {
				limit: options.limit,
				skip: options.skip,
			};

			const result = listFiles(params);
			if (result.ddocs.length === 0) {
				console.log('No ddocs found.');
				return;
			}

			const table = new Table({
				head: [columnNames.index, columnNames.ddocId, columnNames.title, columnNames.status, columnNames.local, columnNames.onchain, columnNames.created, columnNames.lastModified],
				colWidths: [
					columnWidth[columnNames.index],
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

			result.ddocs.forEach((ddoc, index) => {
				const ddocId = (ddoc as any).ddocId || 'N/A';
				table.push([
					index + 1,
					ddocId,
					ddoc.title.length > 23 ? ddoc.title.substring(0, 20) + '...' : ddoc.title,
					ddoc.syncStatus,
					ddoc.localVersion,
					ddoc.onchainVersion,
					formatDate(ddoc.createdAt),
					getElapsedTime(ddoc.updatedAt),
				]);
			});

			console.log(`\nFound ${result.total} ddoc(s):\n`);
			console.log(table.toString());
			if (result.hasNext) {
				console.log('\n(More results available. Use --skip and --limit for pagination)');
			}
		} catch (error: any) {
			console.error('Error listing ddocs:', error.message);
			throw error; 
		}
	});
