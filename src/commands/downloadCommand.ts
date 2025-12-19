import { Command } from 'commander';
import * as fs from 'fs';
import { getFile } from '../domain/file';

export const downloadCommand = new Command()
	.name('download')
	.description('Download a ddoc to a local file')
	.argument('<ddocId>', 'The ddoc ID to download')
	.option('-o, --output <filename>', 'Output filename (only supports markdown)')
	.action(async (ddocId: string, options: { output?: string }) => {
		try {
			const file = getFile(ddocId);
			if (!file) {
				console.error(`Ddoc with ID "${ddocId}" not found.`);
				return;
			}

			let outputFilename: string = file.title;
			if (options.output) {
				outputFilename = options.output.endsWith('.md') ? options.output : `${options.output}.md`;
			}

			fs.writeFileSync(outputFilename, file.content, 'utf-8');

			console.log(`\n✓ Ddoc downloaded successfully to: ${outputFilename}\n`);
		} catch (error: any) {
			console.error('Error downloading ddoc:', error.message);
			throw error;
		}
	});

