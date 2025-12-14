/**
 * Comment-related type definitions
 */

export interface CommentAuthor {
	fullName: string;
	slug: string;
	avatar?: string;
	bio?: string;
	contactId: string;
}

export interface Comment {
	_id: string;
	postId: string;
	content: string;
	authorId: string;
	author: CommentAuthor;
	parentCommentId?: string;
	repliesCount: number;
	reactions: Record<string, number>;
	createdAt: string;
	updatedAt?: string;
	replies?: Comment[];
	[key: string]: unknown;
}

export interface CommentsExport {
	fetchedAt: string;
	totalComments: number;
	communityId: string;
	groupId: string;
	postId: string;
	comments: Comment[];
}

export interface CommentFetchOptions {
	limit?: number;
	previousId?: string;
	parentCommentId?: string;
}
