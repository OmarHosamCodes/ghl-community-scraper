/**
 * Community and Group type definitions
 */

export interface Group {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	coverImage?: string;
	icon?: string;
	visibility: string;
	membersCount: number;
	postsCount?: number;
	isDefault?: boolean;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface Channel {
	_id: string;
	name: string;
	slug?: string;
	description?: string;
	type: string;
	groupId: string;
	isDefault?: boolean;
	postsCount?: number;
	[key: string]: unknown;
}

export interface Community {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	logo?: string;
	coverImage?: string;
	membersCount: number;
	groupsCount?: number;
	visibility: string;
	createdAt?: string;
	updatedAt?: string;
	settings?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface GroupDetailResponse {
	groupDetail: Group;
	membershipQuestions: unknown | null;
	user: unknown[];
	owner: {
		_id: string;
		contactId: string;
		fullName: string;
		slug: string;
		avatar?: string;
	};
}

export interface CommunityExport {
	fetchedAt: string;
	community: Community;
}

export interface GroupFetchOptions {
	limit?: number;
	previousId?: string;
}
