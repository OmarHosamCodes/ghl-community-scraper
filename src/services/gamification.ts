import { createApiClient } from "../api";
import { env } from "../config/env";
import type {
	Badge,
	GamificationConfig,
	GamificationExport,
	LeaderboardEntry,
	LeaderboardFetchOptions,
	Level,
	PointAction,
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
		return `/communities/${this.communityId}/groups/${this.groupId}/public/leaderboard`;
	}

	/**
	 * Get the badges endpoint
	 */
	private getBadgesEndpoint(): string {
		return `/communities/${this.communityId}/public/badges`;
	}

	/**
	 * Get the levels endpoint
	 */
	private getLevelsEndpoint(): string {
		return `/communities/${this.communityId}/public/levels`;
	}

	/**
	 * Get the point actions endpoint
	 */
	private getPointActionsEndpoint(): string {
		return `/communities/${this.communityId}/public/point-actions`;
	}

	/**
	 * Get the gamification config endpoint
	 */
	private getConfigEndpoint(): string {
		return `/communities/${this.communityId}/public/gamification`;
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
	 * Fetch all available badges
	 */
	async fetchBadges(): Promise<Badge[]> {
		const endpoint = this.getBadgesEndpoint();
		console.log(`🏅 Fetching badges: ${endpoint}`);

		try {
			const response = await this.client.get<Badge[]>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching badges:", error);
			return [];
		}
	}

	/**
	 * Fetch all levels
	 */
	async fetchLevels(): Promise<Level[]> {
		const endpoint = this.getLevelsEndpoint();
		console.log(`📊 Fetching levels: ${endpoint}`);

		try {
			const response = await this.client.get<Level[]>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching levels:", error);
			return [];
		}
	}

	/**
	 * Fetch all point actions
	 */
	async fetchPointActions(): Promise<PointAction[]> {
		const endpoint = this.getPointActionsEndpoint();
		console.log(`⭐ Fetching point actions: ${endpoint}`);

		try {
			const response = await this.client.get<PointAction[]>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching point actions:", error);
			return [];
		}
	}

	/**
	 * Fetch gamification configuration
	 */
	async fetchConfig(): Promise<GamificationConfig | null> {
		const endpoint = this.getConfigEndpoint();
		console.log(`⚙️ Fetching gamification config: ${endpoint}`);

		try {
			const response = await this.client.get<GamificationConfig>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching gamification config:", error);
			return null;
		}
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

		const badges = await this.fetchBadges();
		await Bun.sleep(delayMs);

		const levels = await this.fetchLevels();
		await Bun.sleep(delayMs);

		const pointActions = await this.fetchPointActions();
		await Bun.sleep(delayMs);

		const config = await this.fetchConfig();

		return {
			fetchedAt: new Date().toISOString(),
			communityId: this.communityId,
			groupId: this.groupId,
			leaderboard,
			badges,
			levels,
			pointActions,
			config: config ?? undefined,
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
