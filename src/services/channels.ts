import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Channel } from "../types";

/**
 * Channels service for fetching community channels
 */
export class ChannelsService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the channels endpoint
	 */
	private getChannelsEndpoint(): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/channels`;
	}

	/**
	 * Fetch all channels (single request)
	 */
	async fetchAll(): Promise<Channel[]> {
		const endpoint = this.getChannelsEndpoint();

		try {
			const response = await this.client.get<Channel[]>(endpoint);
			return response.data;
		} catch {
			return [];
		}
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
