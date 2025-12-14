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
		return `/communities/${this.communityId}/groups/${this.groupId}/public/members`;
	}

	/**
	 * Get the user profile endpoint
	 */
	private getProfileEndpoint(userSlug: string): string {
		return `/communities/${this.communityId}/public/members/${userSlug}`;
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
	 * Fetch all members with pagination
	 */
	async fetchAll(options: { delayMs?: number } = {}): Promise<User[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const allUsers: User[] = [];
		let previousId: string | undefined;
		let pageNumber = 1;

		console.log("🚀 Starting to fetch all members...\n");

		while (true) {
			try {
				const users = await this.fetchPage({ previousId });

				if (users.length === 0) {
					console.log("\n✅ No more members to fetch. Done!");
					break;
				}

				allUsers.push(...users);
				console.log(
					`📄 Page ${pageNumber}: Fetched ${users.length} members (Total: ${allUsers.length})`,
				);

				const lastUser = users[users.length - 1];
				previousId = lastUser?._id;
				pageNumber++;

				await Bun.sleep(delayMs);
			} catch (error) {
				console.error(`\n❌ Error fetching members page ${pageNumber}:`, error);
				break;
			}
		}

		return allUsers;
	}

	/**
	 * Fetch a single user's profile by slug
	 */
	async fetchProfile(userSlug: string): Promise<UserProfile | null> {
		try {
			const endpoint = this.getProfileEndpoint(userSlug);
			console.log(`👤 Fetching profile: ${endpoint}`);

			const response = await this.client.get<UserProfile>(endpoint);
			return response.data;
		} catch (error) {
			console.error(`❌ Error fetching profile for ${userSlug}:`, error);
			return null;
		}
	}

	/**
	 * Fetch profiles for multiple users
	 */
	async fetchProfiles(
		userSlugs: string[],
		options: { delayMs?: number } = {},
	): Promise<UserProfile[]> {
		const { delayMs = env.fetchDelayMs } = options;
		const profiles: UserProfile[] = [];

		for (const slug of userSlugs) {
			const profile = await this.fetchProfile(slug);
			if (profile) {
				profiles.push(profile);
			}
			await Bun.sleep(delayMs);
		}

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
