import { createApiClient, getPostsEndpoint } from "../api";
import { env } from "../config/env";
import type { FetchOptions, Post } from "../types";

/**
 * Posts service for fetching community posts
 */
export class PostsService {
	private client = createApiClient();
	private endpoint: string;

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {
		this.endpoint = getPostsEndpoint(communityId, groupId);
	}

	/**
	 * Fetch a single page of posts
	 */
	async fetchPage(options: FetchOptions = {}): Promise<Post[]> {
		const { limit = env.fetchLimit, previousId } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (previousId) {
			params.previousId = previousId;
		}

		const response = await this.client.get<Post[]>(this.endpoint, { params });
		return response.data;
	}

	/**
	 * Fetch all posts with pagination
	 */
	async fetchAll(options: { delayMs?: number } = {}): Promise<Post[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allPosts: Post[] = [];
		let previousId: string | undefined;

		while (true) {
			try {
				const posts = await this.fetchPage({ previousId });

				if (posts.length === 0) {
					break;
				}

				allPosts.push(...posts);

				// Get the last post ID for the next page
				const lastPost = posts[posts.length - 1];
				previousId = lastPost?._id;

				// Rate limiting delay
				await Bun.sleep(delayMs);
			} catch {
				break;
			}
		}

		return allPosts;
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
