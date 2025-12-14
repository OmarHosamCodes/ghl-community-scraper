import { createApiClient } from "../api";
import { env } from "../config/env";
import type {
	GamificationExport,
	LeaderboardEntry,
	LeaderboardFetchOptions,
} from "../types";

/**
 * Gamification service for fetching leaderboards, badges, levels, and points
 */
export class GamificationService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the leaderboard endpoint
	 */
	private getLeaderboardEndpoint(): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/leaderboard`;
	}

	/**
	 * Fetch leaderboard entries
	 */
	async fetchLeaderboard(
		options: LeaderboardFetchOptions = {},
	): Promise<LeaderboardEntry[]> {
		const { limit = 100, offset = 0, period = "all" } = options;

		const params: Record<string, string> = {
			limit: String(limit),
			offset: String(offset),
			period,
		};

		const endpoint = this.getLeaderboardEndpoint();
		console.log(
			`🏆 Fetching leaderboard: ${endpoint}?${new URLSearchParams(params).toString()}`,
		);

		try {
			const response = await this.client.get<LeaderboardEntry[]>(endpoint, {
				params,
			});
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching leaderboard:", error);
			return [];
		}
	}

	/**
	 * Fetch all leaderboard entries with pagination
	 */
	async fetchFullLeaderboard(
		options: { delayMs?: number; period?: "all" | "weekly" | "monthly" } = {},
	): Promise<LeaderboardEntry[]> {
		const { delayMs = env.fetchDelayMs, period = "all" } = options;
		const allEntries: LeaderboardEntry[] = [];
		let offset = 0;
		const limit = 100;
		let pageNumber = 1;

		console.log("🚀 Starting to fetch full leaderboard...\n");

		while (true) {
			try {
				const entries = await this.fetchLeaderboard({ limit, offset, period });

				if (entries.length === 0) {
					console.log("\n✅ No more leaderboard entries. Done!");
					break;
				}

				allEntries.push(...entries);
				console.log(
					`📄 Page ${pageNumber}: Fetched ${entries.length} entries (Total: ${allEntries.length})`,
				);

				offset += limit;
				pageNumber++;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(
					`\n❌ Error fetching leaderboard page ${pageNumber}:`,
					error,
				);
				break;
			}
		}

		return allEntries;
	}

	/**
	 * Fetch all gamification data
	 */
	async fetchAll(
		options: { delayMs?: number } = {},
	): Promise<GamificationExport> {
		const { delayMs = env.fetchDelayMs } = options;

		console.log("🎮 Fetching all gamification data...\n");

		const leaderboard = await this.fetchFullLeaderboard({ delayMs });
		await Bun.sleep(delayMs);

		return {
			fetchedAt: new Date().toISOString(),
			communityId: this.communityId,
			groupId: this.groupId,
			leaderboard,
		};
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
