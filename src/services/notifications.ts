import { createApiClient } from "../api";
import { env } from "../config/env";
import type { Notification, NotificationFetchOptions } from "../types";

/**
 * Notifications service for fetching user notifications
 */
export class NotificationsService {
	private client = createApiClient();

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {}

	/**
	 * Get the notifications endpoint
	 */
	private getNotificationsEndpoint(): string {
		return "/clientclub/notifications";
	}

	/**
	 * Fetch notifications for the current user
	 */
	async fetchAll(
		options: NotificationFetchOptions = {},
	): Promise<Notification[]> {
		const { limit = 21, read = false } = options;

		const params: Record<string, string> = {
			limit: String(limit),
			read: String(read),
		};

		const endpoint = this.getNotificationsEndpoint();

		try {
			const response = await this.client.get<Notification[]>(endpoint, {
				params,
			});
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
