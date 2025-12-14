import { createApiClient } from "../api";
import { env } from "../config/env";
import type {
	Channel,
	Community,
	CommunityExport,
	Group,
	GroupFetchOptions,
} from "../types";

/**
 * Community service for fetching community, groups, and channels
 */
export class CommunityService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the community info endpoint
	 */
	private getCommunityEndpoint(): string {
		return `/communities/${this.communityId}`;
	}

	/**
	 * Get the community info by slug endpoint
	 */
	private getCommunityBySlugEndpoint(slug: string): string {
		return `/communities/${this.communityId}/groups/slug/${slug}`;
	}

	/**
	 * Get the groups endpoint
	 */
	private getGroupsEndpoint(): string {
		return `/communities/${this.communityId}/groups`;
	}

	/**
	 * Get the channels endpoint for a group
	 */
	private getChannelsEndpoint(groupId: string = this.groupId): string {
		return `/communities/${this.communityId}/groups/${groupId}/channels`;
	}

	/**
	 * Fetch community information
	 */
	async fetchCommunity(): Promise<Community | null> {
		const endpoint = this.getCommunityEndpoint();
		console.log(`🏠 Fetching community info: ${endpoint}`);

		try {
			const response = await this.client.get<Community>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching community:", error);
			return null;
		}
	}

	/**
	 * Fetch community information by group slug
	 */
	async fetchCommunityBySlug(slug: string): Promise<Group | null> {
		const endpoint = this.getCommunityBySlugEndpoint(slug);
		console.log(`🏠 Fetching community info by slug: ${endpoint}`);

		try {
			const response = await this.client.get<Group>(endpoint);
			return response.data;
		} catch (error) {
			console.error(`❌ Error fetching community by slug ${slug}:`, error);
			return null;
		}
	}

	/**
	 * Fetch a single page of groups
	 */
	async fetchGroupsPage(options: GroupFetchOptions = {}): Promise<Group[]> {
		const { limit = env.fetchLimit, previousId } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (previousId) params.previousId = previousId;

		const endpoint = this.getGroupsEndpoint();
		console.log(
			`📁 Fetching groups: ${endpoint}?${new URLSearchParams(params).toString()}`,
		);

		try {
			const response = await this.client.get<Group[]>(endpoint, { params });
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching groups:", error);
			return [];
		}
	}

	/**
	 * Fetch all groups with pagination
	 */
	async fetchAllGroups(options: { delayMs?: number } = {}): Promise<Group[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allGroups: Group[] = [];
		let previousId: string | undefined;
		let pageNumber = 1;

		console.log("🚀 Starting to fetch all groups...\n");

		while (true) {
			try {
				const groups = await this.fetchGroupsPage({ previousId });

				if (groups.length === 0) {
					console.log("\n✅ No more groups to fetch. Done!");
					break;
				}

				allGroups.push(...groups);
				console.log(
					`📄 Page ${pageNumber}: Fetched ${groups.length} groups (Total: ${allGroups.length})`,
				);

				const lastGroup = groups[groups.length - 1];
				previousId = lastGroup?._id;
				pageNumber++;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(`\n❌ Error fetching groups page ${pageNumber}:`, error);
				break;
			}
		}

		return allGroups;
	}

	/**
	 * Fetch channels for a specific group
	 */
	async fetchChannels(groupId?: string): Promise<Channel[]> {
		const endpoint = this.getChannelsEndpoint(groupId);
		console.log(`📺 Fetching channels: ${endpoint}`);

		try {
			const response = await this.client.get<Channel[]>(endpoint);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching channels:", error);
			return [];
		}
	}

	/**
	 * Fetch channels for all groups
	 */
	async fetchAllChannels(
		groups: Group[],
		options: { delayMs?: number } = {},
	): Promise<Channel[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allChannels: Channel[] = [];

		for (const group of groups) {
			const channels = await this.fetchChannels(group._id);
			allChannels.push(...channels);
			await Bun.sleep(delayMs);
		}

		return allChannels;
	}

	/**
	 * Fetch all community data
	 */
	async fetchAll(options: { delayMs?: number } = {}): Promise<CommunityExport> {
		const { delayMs = env.fetchDelayMs } = options;

		console.log("🏠 Fetching all community data...\n");

		const community = await this.fetchCommunity();
		await Bun.sleep(delayMs);

		const groups = await this.fetchAllGroups({ delayMs });
		await Bun.sleep(delayMs);

		const channels = await this.fetchAllChannels(groups, { delayMs });

		if (!community) {
			throw new Error("Failed to fetch community information");
		}

		return {
			fetchedAt: new Date().toISOString(),
			community,
			groups,
			channels,
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
