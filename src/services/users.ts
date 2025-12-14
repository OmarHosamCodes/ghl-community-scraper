import { createApiClient } from "../api";
import { env } from "../config/env";
import type { User, UserFetchOptions, UserProfile } from "../types";

/**
 * Users service for fetching community members
 */
export class UsersService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the members endpoint
	 */
	private getMembersEndpoint(): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/users/list`;
	}

	/**
	 * Get the user profile endpoint
	 */
	private getProfileEndpoint(locationId: string): string {
		return `/communities/${this.communityId}/users/${locationId}`;
	}

	/**
	 * Fetch a single page of members
	 */
	async fetchPage(options: UserFetchOptions = {}): Promise<User[]> {
		const { limit = env.fetchLimit, previousId, search } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (previousId) params.previousId = previousId;
		if (search) params.search = search;

		const endpoint = this.getMembersEndpoint();
		console.log(
			`👥 Fetching members: ${endpoint}?${new URLSearchParams(params).toString()}`,
		);

		const response = await this.client.get<User[]>(endpoint, { params });
		return response.data;
	}

	/**
	 * Fetch all members (single request)
	 */
	async fetchAll(): Promise<User[]> {
		const endpoint = this.getMembersEndpoint();
		console.log(`👥 Fetching all members: ${endpoint}`);

		try {
			const response = await this.client.get<User[]>(endpoint);
			console.log(`✅ Fetched ${response.data.length} members`);
			return response.data;
		} catch (error) {
			console.error("❌ Error fetching members:", error);
			return [];
		}
	}

	/**
	 * Fetch a single user's profile by slug
	 */
	async fetchProfile(locationId: string): Promise<UserProfile | null> {
		try {
			const endpoint = this.getProfileEndpoint(locationId);
			console.log(`👤 Fetching profile: ${endpoint}`);

			const response = await this.client.get<UserProfile>(endpoint);
			return response.data;
		} catch (error) {
			console.error(`❌ Error fetching profile for ${locationId}:`, error);
			return null;
		}
	}

	/**
	 * Fetch profiles for multiple users
	 */
	async fetchProfiles(
		locationIds: string[],
		options: { delayMs?: number } = {},
	): Promise<UserProfile[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const profiles: UserProfile[] = [];

		for (const locationId of locationIds) {
			const profile = await this.fetchProfile(locationId);
			if (profile) {
				profiles.push(profile);
			}
			await Bun.sleep(delayMs);
		}

		return profiles;
	}

	/**
	 * Fetch all members and enrich with full profile data
	 */
	async fetchAllWithProfiles(
		options: { delayMs?: number } = {},
	): Promise<UserProfile[]> {
		const { delayMs = env.fetchDelayMs } = options;

		console.log("🚀 Starting to fetch all members with full profiles...\n");

		// Step 1: Fetch all members (single request)
		const members = await this.fetchAll();

		if (members.length === 0) {
			console.log("⚠️ No members found.");
			return [];
		}

		console.log(
			`\n📋 Found ${members.length} members. Fetching full profiles...\n`,
		);

		// Step 2: Fetch full profile for each member using their locationId
		const profiles: UserProfile[] = [];
		let completed = 0;

		for (const member of members) {
			const locationId = member._id;
			const profile = await this.fetchProfile(locationId);

			if (profile) {
				profiles.push(profile);
			} else {
				// Fallback to basic member data if profile fetch fails
				profiles.push(member as UserProfile);
			}

			completed++;
			console.log(
				`📊 Progress: ${completed}/${members.length} profiles fetched`,
			);

			await Bun.sleep(delayMs);
		}

		console.log(`\n✅ Completed! Fetched ${profiles.length} full profiles.`);
		return profiles;
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
