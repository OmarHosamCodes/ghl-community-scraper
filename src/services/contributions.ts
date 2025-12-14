import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Contribution, ContributionFetchOptions } from "../types";

interface FetchOptions {
	delayMs?: number;
	concurrency?: number;
}

/**
 * API response wrapper for contributions
 */
interface ContributionsResponse {
	contributions: Contribution[];
	total: number;
}

/**
 * Contributions service for fetching user contributions
 */
export class ContributionsService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the contributions endpoint for a user
	 */
	private getContributionsEndpoint(userId: string): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/users/${userId}/contributions`;
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
	 * Fetch a single page of contributions for a user
	 */
	async fetchPage(
		userId: string,
		options: ContributionFetchOptions = {},
	): Promise<Contribution[]> {
		const { limit = env.fetchLimit, lastPaginatedId } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (lastPaginatedId) params.lastPaginatedId = lastPaginatedId;

		const endpoint = this.getContributionsEndpoint(userId);

		try {
			const response = await this.client.get<ContributionsResponse>(endpoint, {
				params,
			});
			// API returns { contributions: [...], total: number }
			return response.data.contributions ?? [];
		} catch {
			return [];
		}
	}

	/**
	 * Fetch all contributions for a user with pagination
	 */
	async fetchAll(
		userId: string,
		options: { delayMs?: number } = {},
	): Promise<Contribution[]> {
		const { delayMs = 100 } = options;
		const allContributions: Contribution[] = [];
		let lastPaginatedId: string | undefined;

		while (true) {
			try {
				const contributions = await this.fetchPage(userId, { lastPaginatedId });

				if (!contributions || contributions.length === 0) {
					break;
				}

				allContributions.push(...contributions);

				const lastContribution = contributions[contributions.length - 1];
				lastPaginatedId = lastContribution?._id;

				if (contributions.length < env.fetchLimit) {
					break;
				}

				await Bun.sleep(delayMs);
			} catch {
				break;
			}
		}

		return allContributions;
	}

	/**
	 * Fetch contributions for multiple users with parallel processing
	 */
	async fetchForUsers(
		userIds: string[],
		options: FetchOptions = {},
	): Promise<Map<string, Contribution[]>> {
		const { delayMs = env.fetchDelayMs, concurrency = 5 } = options;
		const contributionsMap = new Map<string, Contribution[]>();

		console.log(
			`\n🏆 Fetching contributions for ${userIds.length} users (concurrency: ${concurrency})...\n`,
		);

		let completed = 0;
		const total = userIds.length;

		await this.processInBatches(
			userIds,
			async (userId) => {
				const contributions = await this.fetchAll(userId, { delayMs: 50 });
				contributionsMap.set(userId, contributions);
				completed++;
				console.log(
					`📊 Contributions: ${completed}/${total} (${contributions.length} items)`,
				);
				return contributions;
			},
			concurrency,
			delayMs,
		);

		return contributionsMap;
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
