import { Command } from 'commander';
import { deleteFile } from '../domain/file';

export const deleteCommand = new Command()
	.name('delete')
	.description('Delete one or more ddocs by their IDs')
	.argument('<ddocIds...>', 'One or more ddoc IDs to delete (space-separated)')
	.action(async (ddocIds: string[]) => {
		try {
			for (const ddocId of ddocIds) {
				try {
					await deleteFile(ddocId);
					console.log(`ddoc ${ddocId} deleted successfully`);
				} catch (error: any) {
					console.error(`Error deleting ddoc ${ddocId}:`, error.message);
					// Continue with next ddoc instead of stopping
				}
			}
		} catch (error: any) {
			console.error('Error:', error.message);
			throw error;
		}
	});

