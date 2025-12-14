import { createApiClient } from "../api";
import { env } from "../config/env";
import type {
	Community,
	CommunityExport,
	Group,
	GroupDetailResponse,
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
	 * Get the community info by slug endpoint
	 */
	private getCommunityBySlugEndpoint(slug: string): string {
		return `/communities/${this.communityId}/groups/slug/${slug}`;
	}

	/**
	 * Fetch community information using the group slug endpoint
	 */
	async fetchCommunity(slug?: string): Promise<Community | null> {
		const groupSlug = slug || env.groupSlug;
		const endpoint = this.getCommunityBySlugEndpoint(groupSlug);

		try {
			const response = await this.client.get<GroupDetailResponse>(endpoint);
			const { groupDetail } = response.data;

			// Return groupDetail as Community (it contains all needed fields)
			return groupDetail as unknown as Community;
		} catch {
			return null;
		}
	}

	/**
	 * Fetch community information by group slug
	 */
	async fetchCommunityBySlug(slug: string): Promise<Group | null> {
		const endpoint = this.getCommunityBySlugEndpoint(slug);

		try {
			const response = await this.client.get<Group>(endpoint);
			return response.data;
		} catch {
			return null;
		}
	}

	/**
	 * Fetch all community data
	 */
	async fetchAll(options: { delayMs?: number } = {}): Promise<CommunityExport> {
		const { delayMs = env.fetchDelayMs } = options;

		const community = await this.fetchCommunity();
		await Bun.sleep(delayMs);

		if (!community) {
			throw new Error("Failed to fetch community information");
		}

		return {
			fetchedAt: new Date().toISOString(),
			community,
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
