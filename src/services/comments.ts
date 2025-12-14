import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Comment, CommentFetchOptions } from "../types";

/**
 * Comments service for fetching post comments with recursive reply extraction
 */
export class CommentsService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the comments endpoint for a specific post
	 */
	private getCommentsEndpoint(postId: string): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/public/posts/${postId}/comments`;
	}

	/**
	 * Fetch a single page of comments for a post
	 */
	async fetchPage(
		postId: string,
		options: CommentFetchOptions = {},
	): Promise<Comment[]> {
		const { limit = env.fetchLimit, previousId, parentCommentId } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (previousId) params.previousId = previousId;
		if (parentCommentId) params.parentCommentId = parentCommentId;

		const endpoint = this.getCommentsEndpoint(postId);
		console.log(
			`  💬 Fetching comments: ${endpoint}?${new URLSearchParams(params).toString()}`,
		);

		const response = await this.client.get<Comment[]>(endpoint, { params });
		return response.data;
	}

	/**
	 * Fetch all comments for a post (top-level only)
	 */
	async fetchAllForPost(
		postId: string,
		options: { delayMs?: number } = {},
	): Promise<Comment[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allComments: Comment[] = [];
		let previousId: string | undefined;
		let pageNumber = 1;

		while (true) {
			try {
				const comments = await this.fetchPage(postId, { previousId });

				if (comments.length === 0) break;

				allComments.push(...comments);
				console.log(
					`    📝 Page ${pageNumber}: Fetched ${comments.length} comments (Total: ${allComments.length})`,
				);

				const lastComment = comments[comments.length - 1];
				previousId = lastComment?._id;
				pageNumber++;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(
					`    ❌ Error fetching comments page ${pageNumber}:`,
					error,
				);
				break;
			}
		}

		return allComments;
	}

	/**
	 * Fetch replies for a specific comment
	 */
	async fetchReplies(
		postId: string,
		parentCommentId: string,
		options: { delayMs?: number } = {},
	): Promise<Comment[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allReplies: Comment[] = [];
		let previousId: string | undefined;

		while (true) {
			try {
				const replies = await this.fetchPage(postId, {
					previousId,
					parentCommentId,
				});

				if (replies.length === 0) break;

				allReplies.push(...replies);

				const lastReply = replies[replies.length - 1];
				previousId = lastReply?._id;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(`    ❌ Error fetching replies:`, error);
				break;
			}
		}

		return allReplies;
	}

	/**
	 * Recursively fetch all comments and their nested replies
	 */
	async fetchAllWithReplies(
		postId: string,
		options: { delayMs?: number; maxDepth?: number } = {},
	): Promise<Comment[]> {
		const { delayMs = env.fetchDelayMs, maxDepth = 10 } = options;

		// First, get all top-level comments
		const topLevelComments = await this.fetchAllForPost(postId, { delayMs });

		// Recursively fetch replies for each comment
		const fetchRepliesRecursively = async (
			comment: Comment,
			currentDepth: number,
		): Promise<Comment> => {
			if (currentDepth >= maxDepth || comment.repliesCount === 0) {
				return comment;
			}

			console.log(
				`      🔄 Fetching ${comment.repliesCount} replies for comment ${comment._id} (depth: ${currentDepth})`,
			);

			const replies = await this.fetchReplies(postId, comment._id, { delayMs });

			// Recursively fetch nested replies
			const repliesWithNested = await Promise.all(
				replies.map((reply) =>
					fetchRepliesRecursively(reply, currentDepth + 1),
				),
			);

			return {
				...comment,
				replies: repliesWithNested,
			};
		};

		// Process all top-level comments
		const commentsWithReplies = await Promise.all(
			topLevelComments.map((comment) => fetchRepliesRecursively(comment, 1)),
		);

		return commentsWithReplies;
	}

	/**
	 * Count total comments including nested replies
	 */
	countTotalComments(comments: Comment[]): number {
		let total = 0;

		const countRecursive = (commentList: Comment[]) => {
			for (const comment of commentList) {
				total++;
				if (comment.replies && comment.replies.length > 0) {
					countRecursive(comment.replies);
				}
			}
		};

		countRecursive(comments);
		return total;
	}

	/**
	 * Get community and group info
	 */
	getInfo() {
		return {
			communityId: this.communityId,
			groupId: this.groupId,
		};
	}
}
