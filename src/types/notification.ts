/**
 * Notification-related type definitions
 */

export interface Notification {
	_id: string;
	type: string;
	message?: string;
	read: boolean;
	userId?: string;
	entityId?: string;
	entityType?: string;
	actorId?: string;
	actor?: {
		fullName: string;
		avatar?: string;
		slug?: string;
	};
	createdAt: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface NotificationsExport {
	fetchedAt: string;
	totalNotifications: number;
	notifications: Notification[];
}

export interface NotificationFetchOptions {
	limit?: number;
	read?: boolean;
}
