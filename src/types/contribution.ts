/**
 * Contribution-related type definitions
 */

export interface Contribution {
	_id: string;
	userId: string;
	type: string;
	entityId?: string;
	entityType?: string;
	points?: number;
	description?: string;
	createdAt: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface ContributionsExport {
	fetchedAt: string;
	totalContributions: number;
	communityId: string;
	groupId: string;
	userId: string;
	contributions: Contribution[];
}

export interface ContributionFetchOptions {
	limit?: number;
	lastPaginatedId?: string;
}
