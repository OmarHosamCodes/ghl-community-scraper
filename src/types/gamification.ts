/**
 * Gamification-related type definitions
 */

export interface LeaderboardEntry {
	_id: string;
	userId: string;
	contactId: string;
	fullName: string;
	slug: string;
	avatar?: string;
	points: number;
	level: number;
	rank: number;
	badges?: string[];
	[key: string]: unknown;
}

export interface Badge {
	_id: string;
	name: string;
	description?: string;
	icon?: string;
	iconUrl?: string;
	color?: string;
	points?: number;
	criteria?: string;
	isActive: boolean;
	earnedCount?: number;
	createdAt?: string;
	[key: string]: unknown;
}

export interface Level {
	_id: string;
	name: string;
	level: number;
	minPoints: number;
	maxPoints?: number;
	icon?: string;
	color?: string;
	benefits?: string[];
	[key: string]: unknown;
}

export interface PointAction {
	_id: string;
	action: string;
	description?: string;
	points: number;
	isActive: boolean;
	[key: string]: unknown;
}

export interface GamificationConfig {
	isEnabled: boolean;
	levels: Level[];
	badges: Badge[];
	pointActions: PointAction[];
	[key: string]: unknown;
}

export interface GamificationExport {
	fetchedAt: string;
	communityId: string;
	groupId: string;
	leaderboard: LeaderboardEntry[];
}

export interface LeaderboardFetchOptions {
	limit?: number;
	offset?: number;
}
