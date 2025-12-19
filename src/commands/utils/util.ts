export const columnNames = {
	index: '#',
	ddocId: 'DDoc ID',
	title: 'Title',
	status: 'Status',
	local: 'Local',
	onchain: 'On-chain',
	deleted: 'Deleted',
	created: 'Created',
	lastModified: 'Last modified',
} as const;

export const columnWidth: Record<string, number> = {
	[columnNames.index]: 4,
	[columnNames.ddocId]: 25,
	[columnNames.title]: 25,
	[columnNames.status]: 10,
	[columnNames.local]: 8,
	[columnNames.onchain]: 10,
	[columnNames.deleted]: 10,
	[columnNames.created]: 12,
	[columnNames.lastModified]: 20,
};

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	return `${day}-${month}-${year}`;
}

export function getElapsedTime(date: Date | string): string {
	const now = new Date();
	const past = typeof date === 'string' ? new Date(date) : date;
	const diffMs = now.getTime() - past.getTime();
	
	if (diffMs < 0) {
		return 'just now';
	}
	
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	const units = [
		{ value: diffSeconds, max: 60, name: 'second' },
		{ value: diffMinutes, max: 60, name: 'minute' },
		{ value: diffHours, max: 24, name: 'hour' },
		{ value: diffDays, max: 7, name: 'day' },
		{ value: diffWeeks, max: 4, name: 'week' },
		{ value: diffMonths, max: 12, name: 'month' },
		{ value: diffYears, max: Infinity, name: 'year' },
	];

	const unit = units.find(u => u.value < u.max);
	if (unit) {
		const label = unit.value === 1 ? unit.name : `${unit.name}s`;
		return `${unit.value} ${label} ago`;
	}

	return 'just now';
}

