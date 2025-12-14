import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Comment, CommentFetchOptions } from "../types";

interface FetchOptions {
	delayMs?: number;
	maxDepth?: number;
	concurrency?: number;
	verbose?: boolean;
}

/**
 * Comments service for fetching post comments with optimized parallel fetching
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
		return `/communities/${this.communityId}/groups/${this.groupId}/posts/${postId}/comments`;
	}

	/**
	 * Fetch a single page of comments for a post (optimized - minimal logging)
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
		const response = await this.client.get<Comment[]>(endpoint, { params });
		return response.data;
	}

	/**
	 * Fetch all comments for a post (top-level only) - optimized with minimal delays
	 */
	async fetchAllForPost(
		postId: string,
		options: FetchOptions = {},
	): Promise<Comment[]> {
		const { delayMs = 100, verbose = false } = options;
		const allComments: Comment[] = [];
		let previousId: string | undefined;

		while (true) {
			try {
				const comments = await this.fetchPage(postId, { previousId });
				if (comments.length === 0) break;

				allComments.push(...comments);
				previousId = comments[comments.length - 1]?._id;

				// Only delay if we're getting more pages
				if (comments.length === env.fetchLimit) {
					await Bun.sleep(delayMs);
				}
			} catch (error) {
				if (verbose) console.error(`    ❌ Error fetching comments:`, error);
				break;
			}
		}

		return allComments;
	}

	/**
	 * Fetch all replies for a comment - optimized
	 */
	async fetchReplies(
		postId: string,
		parentCommentId: string,
		options: FetchOptions = {},
	): Promise<Comment[]> {
		const { delayMs = 50 } = options;
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
				previousId = replies[replies.length - 1]?._id;

				if (replies.length === env.fetchLimit) {
					await Bun.sleep(delayMs);
				}
			} catch {
				break;
			}
		}

		return allReplies;
	}

	/**
	 * Process items in batches with controlled concurrency
	 */
	private async processInBatches<T, R>(
		items: T[],
		processor: (item: T) => Promise<R>,
		concurrency: number,
		delayBetweenBatches: number,
	): Promise<R[]> {
		const results: R[] = [];

		for (let i = 0; i < items.length; i += concurrency) {
			const batch = items.slice(i, i + concurrency);
			const batchResults = await Promise.all(batch.map(processor));
			results.push(...batchResults);

			// Small delay between batches to avoid rate limiting
			if (i + concurrency < items.length) {
				await Bun.sleep(delayBetweenBatches);
			}
		}

		return results;
	}

	/**
	 * Fetch all comments and their nested replies with optimized parallel fetching
	 */
	async fetchAllWithReplies(
		postId: string,
		options: FetchOptions = {},
	): Promise<Comment[]> {
		const {
			delayMs = 100,
			maxDepth = 10,
			concurrency = 5,
			verbose = false,
		} = options;

		// First, get all top-level comments
		const topLevelComments = await this.fetchAllForPost(postId, {
			delayMs,
			verbose,
		});

		if (topLevelComments.length === 0) return [];

		// Filter comments that have replies to fetch
		const commentsWithReplies = topLevelComments.filter(
			(c) => c.repliesCount > 0,
		);

		if (verbose && commentsWithReplies.length > 0) {
			console.log(
				`    🔄 Fetching replies for ${commentsWithReplies.length} comments...`,
			);
		}

		// Create a map for quick lookup
		const commentMap = new Map<string, Comment>(
			topLevelComments.map((c) => [c._id, { ...c }]),
		);

		// Fetch replies in parallel batches (depth 1)
		if (commentsWithReplies.length > 0) {
			await this.processInBatches(
				commentsWithReplies,
				async (comment) => {
					const replies = await this.fetchReplies(postId, comment._id, {
						delayMs: 50,
					});
					const existingComment = commentMap.get(comment._id);
					if (existingComment) {
						existingComment.replies = replies;
						// Add nested replies to map for further processing
						for (const reply of replies) {
							commentMap.set(reply._id, reply);
						}
					}
				},
				concurrency,
				delayMs,
			);

			// Process nested replies (depth 2+) in parallel batches
			for (let depth = 2; depth < maxDepth; depth++) {
				const pendingReplies = Array.from(commentMap.values()).filter(
					(c) => c.repliesCount > 0 && !c.replies,
				);

				if (pendingReplies.length === 0) break;

				await this.processInBatches(
					pendingReplies,
					async (comment) => {
						const replies = await this.fetchReplies(postId, comment._id, {
							delayMs: 50,
						});
						comment.replies = replies;
						for (const reply of replies) {
							commentMap.set(reply._id, reply);
						}
					},
					concurrency,
					delayMs,
				);
			}
		}

		// Return top-level comments with their nested replies
		return topLevelComments.map((c) => commentMap.get(c._id) || c);
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
