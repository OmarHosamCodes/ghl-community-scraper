import { createApiClient } from "../api";
import { env } from "../config/env";
import type {
	GamificationExport,
	LeaderboardEntry,
	LeaderboardFetchOptions,
} from "../types";

/**
 * API response interface for leaderboard
 * API returns { "30D": [...], "7D": [...], "ALL_TIME": [...] }
 */
interface LeaderboardResponse {
	"30D"?: LeaderboardApiEntry[];
	"7D"?: LeaderboardApiEntry[];
	ALL_TIME?: LeaderboardApiEntry[];
	[key: string]: unknown;
}

/**
 * Raw leaderboard entry from API
 */
interface LeaderboardApiEntry {
	timeFrame: string;
	updatedAt: string;
	rank: number;
	totalPoints: number;
	user: {
		fullName: string;
		slug: string;
		avatar?: string;
		contactId: string;
	};
}

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
	 * Get the leaderboard endpoint (clientclub API)
	 */
	private getLeaderboardEndpoint(): string {
		return `/clientclub/leaderboards/${this.groupId}`;
	}

	/**
	 * Fetch leaderboard entries
	 */
	async fetchLeaderboard(
		options: LeaderboardFetchOptions = {},
	): Promise<LeaderboardEntry[]> {
		const { limit = 100, offset = 0 } = options;

		const params: Record<string, string> = {
			rankLimit: String(limit),
			rankSkip: String(offset),
		};

		const endpoint = this.getLeaderboardEndpoint();

		try {
			const response = await this.client.get<LeaderboardResponse>(endpoint, {
				params,
			});
			const data = response.data;

			// API returns { "30D": [...], "7D": [...], "ALL_TIME": [...] }
			// Use ALL_TIME by default, or combine all time frames
			const allTimeEntries = data.ALL_TIME || [];

			// Transform API entries to our LeaderboardEntry format
			return allTimeEntries.map((entry) => ({
				_id: entry.user.contactId,
				userId: entry.user.contactId,
				contactId: entry.user.contactId,
				fullName: entry.user.fullName,
				slug: entry.user.slug,
				avatar: entry.user.avatar,
				points: entry.totalPoints,
				level: 0, // Not provided by this endpoint
				rank: entry.rank,
				timeFrame: entry.timeFrame,
				updatedAt: entry.updatedAt,
			}));
		} catch {
			return [];
		}
	}

	/**
	 * Fetch all leaderboard entries with pagination
	 */
	async fetchFullLeaderboard(
		options: { delayMs?: number } = {},
	): Promise<LeaderboardEntry[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allEntries: LeaderboardEntry[] = [];
		let offset = 0;
		const limit = 100;

		while (true) {
			try {
				const entries = await this.fetchLeaderboard({ limit, offset });

				if (entries.length === 0) {
					break;
				}

				allEntries.push(...entries);

				offset += limit;
				await Bun.sleep(delayMs);
			} catch {
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
