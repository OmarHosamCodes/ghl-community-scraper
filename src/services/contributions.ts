import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Contribution, ContributionFetchOptions } from "../types";

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
		console.log(
			`🏆 Fetching contributions: ${endpoint}?${new URLSearchParams(params).toString()}`,
		);

		try {
			const response = await this.client.get<Contribution[]>(endpoint, {
				params,
			});
			return response.data;
		} catch (error) {
			console.error(
				`❌ Error fetching contributions for user ${userId}:`,
				error,
			);
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
		const { delayMs = env.fetchDelayMs } = options;
		const allContributions: Contribution[] = [];
		let lastPaginatedId: string | undefined;
		let pageNumber = 1;

		console.log(
			`🏆 Starting to fetch all contributions for user ${userId}...\n`,
		);

		while (true) {
			try {
				const contributions = await this.fetchPage(userId, { lastPaginatedId });

				if (contributions.length === 0) {
					console.log("\n✅ No more contributions to fetch. Done!");
					break;
				}

				allContributions.push(...contributions);
				console.log(
					`📄 Page ${pageNumber}: Fetched ${contributions.length} contributions (Total: ${allContributions.length})`,
				);

				const lastContribution = contributions[contributions.length - 1];
				lastPaginatedId = lastContribution?._id;
				pageNumber++;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(
					`\n❌ Error fetching contributions page ${pageNumber}:`,
					error,
				);
				break;
			}
		}

		return allContributions;
	}

	/**
	 * Fetch contributions for multiple users
	 */
	async fetchForUsers(
		userIds: string[],
		options: { delayMs?: number } = {},
	): Promise<Map<string, Contribution[]>> {
		const { delayMs = env.fetchDelayMs } = options;
		const contributionsMap = new Map<string, Contribution[]>();

		console.log(`\n🏆 Fetching contributions for ${userIds.length} users...\n`);

		let completed = 0;
		for (const userId of userIds) {
			const contributions = await this.fetchAll(userId, { delayMs });
			contributionsMap.set(userId, contributions);
			completed++;
			console.log(
				`📊 Progress: ${completed}/${userIds.length} users' contributions fetched`,
			);
			await Bun.sleep(delayMs);
		}

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
