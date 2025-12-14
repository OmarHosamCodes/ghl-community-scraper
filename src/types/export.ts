/**
 * Full data export type definitions
 */

import type { Comment } from "./comment";
import type { Channel, Community, Group } from "./community";
import type {
	Badge,
	LeaderboardEntry,
	Level,
	PointAction,
} from "./gamification";
import type { Post } from "./post";
import type { User } from "./user";

export interface PostWithComments extends Post {
	comments?: Comment[];
}

export interface FullDataExport {
	fetchedAt: string;
	communityId: string;
	groupId: string;
	metadata: {
		totalPosts: number;
		totalComments: number;
		totalUsers: number;
		totalGroups: number;
		totalChannels: number;
	};
	community?: Community;
	groups: Group[];
	channels: Channel[];
	posts: PostWithComments[];
	users: User[];
	gamification: {
		leaderboard: LeaderboardEntry[];
		badges: Badge[];
		levels: Level[];
		pointActions: PointAction[];
	};
}

export interface ScraperOptions {
	fetchPosts?: boolean;
	fetchComments?: boolean;
	fetchUsers?: boolean;
	fetchGamification?: boolean;
	fetchCommunityInfo?: boolean;
	maxCommentDepth?: number;
	delayMs?: number;
	/** Number of concurrent comment fetches (default: 3) */
	commentConcurrency?: number;
	/** Enable verbose logging for comments */
	verboseComments?: boolean;
}
