/**
 * Post-related type definitions
 */

export interface PostAuthor {
	fullName: string;
	slug: string;
	avatar?: string;
	bio?: string;
	contactId: string;
}

export interface Post {
	_id: string;
	title: string;
	content: string;
	groupId: string;
	channelId: string;
	visibility: string;
	commentsCount: number;
	attachments: unknown[];
	reactions: Record<string, number>;
	createdAt: string;
	author: PostAuthor;
	[key: string]: unknown;
}

export interface PostsExport {
	fetchedAt: string;
	totalPosts: number;
	communityId: string;
	groupId: string;
	posts: Post[];
}

export interface FetchOptions {
	limit?: number;
	previousId?: string;
}
