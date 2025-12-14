/**
 * User-related type definitions
 */

export interface UserSocialLinks {
	facebook?: string;
	twitter?: string;
	linkedin?: string;
	instagram?: string;
	website?: string;
	[key: string]: string | undefined;
}

export interface UserBadge {
	_id: string;
	name: string;
	icon?: string;
	description?: string;
	earnedAt?: string;
}

export interface User {
	_id: string;
	contactId: string;
	fullName: string;
	slug: string;
	email?: string;
	avatar?: string;
	coverImage?: string;
	bio?: string;
	headline?: string;
	location?: string;
	socialLinks?: UserSocialLinks;
	badges?: UserBadge[];
	role?: string;
	isAdmin?: boolean;
	isModerator?: boolean;
	joinedAt?: string;
	lastActiveAt?: string;
	postsCount?: number;
	commentsCount?: number;
	points?: number;
	level?: number;
	[key: string]: unknown;
}

export interface UserProfile extends User {
	stats?: {
		totalPosts: number;
		totalComments: number;
		totalReactions: number;
		totalPoints: number;
	};
}

export interface UsersExport {
	fetchedAt: string;
	totalUsers: number;
	communityId: string;
	groupId: string;
	users: User[];
}

export interface UserFetchOptions {
	limit?: number;
	previousId?: string;
	search?: string;
}
