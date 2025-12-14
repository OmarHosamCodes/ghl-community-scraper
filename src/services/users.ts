import { createApiClient } from "../api";
import { env } from "../config/env";
import type { User, UserFetchOptions, UserProfile } from "../types";

interface FetchOptions {
	delayMs?: number;
	concurrency?: number;
}

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
	private getProfileEndpoint(contactId: string): string {
		return `/communities/${this.communityId}/groups/${this.groupId}/users/${contactId}`;
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
	 * Fetch a single page of members
	 */
	async fetchPage(options: UserFetchOptions = {}): Promise<User[]> {
		const { limit = env.fetchLimit, previousId, search } = options;

		const params: Record<string, string> = { limit: String(limit) };
		if (previousId) params.previousId = previousId;
		if (search) params.search = search;

		const endpoint = this.getMembersEndpoint();
		const response = await this.client.get<User[]>(endpoint, { params });
		return response.data;
	}

	/**
	 * Fetch all members (single request)
	 */
	async fetchAll(): Promise<User[]> {
		const endpoint = this.getMembersEndpoint();

		try {
			const response = await this.client.get<User[]>(endpoint);
			return response.data;
		} catch {
			return [];
		}
	}

	/**
	 * Fetch a single user's profile by contactId
	 */
	async fetchProfile(contactId: string): Promise<UserProfile | null> {
		try {
			const endpoint = this.getProfileEndpoint(contactId);
			const response = await this.client.get<UserProfile>(endpoint);
			return response.data;
		} catch (error: unknown) {
			// Handle axios errors with proper typing
			if (error && typeof error === "object" && "response" in error) {
				const axiosError = error as {
					response?: { status: number; data?: { message?: string } };
				};
				if (axiosError.response?.status === 404) {
					// User profile not found - this is expected for some users
					return null;
				}
			}
			return null;
		}
	}

	/**
	 * Fetch profiles for multiple users with parallel processing
	 */
	async fetchProfiles(
		contactIds: string[],
		options: FetchOptions = {},
	): Promise<UserProfile[]> {
		const { delayMs = env.fetchDelayMs, concurrency = 5 } = options;
		const profiles: UserProfile[] = [];

		await this.processInBatches(
			contactIds,
			async (contactId) => {
				const profile = await this.fetchProfile(contactId);
				if (profile) {
					profiles.push(profile);
				}
				return profile;
			},
			concurrency,
			delayMs,
		);

		return profiles;
	}

	/**
	 * Fetch all members and enrich with full profile data using parallel processing
	 */
	async fetchAllWithProfiles(
		options: FetchOptions = {},
	): Promise<UserProfile[]> {
		const { delayMs = env.fetchDelayMs, concurrency = 5 } = options;

		// Step 1: Fetch all members (single request)
		const members = await this.fetchAll();

		if (members.length === 0) {
			return [];
		}

		// Step 2: Fetch full profile for each member using parallel processing
		const profiles: UserProfile[] = [];

		await this.processInBatches(
			members,
			async (member) => {
				const profile = await this.fetchProfile(member.contactId);
				if (profile) {
					profiles.push(profile);
				} else {
					// Fallback to basic member data if profile fetch fails
					profiles.push(member as UserProfile);
				}
				return profile;
			},
			concurrency,
			delayMs,
		);

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
