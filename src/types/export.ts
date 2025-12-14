/**
 * Full data export type definitions
 */

import type { Comment } from "./comment";
import type { Channel, Community, Group } from "./community";
import type { Contribution } from "./contribution";
import type { LeaderboardEntry } from "./gamification";
import type { Post } from "./post";
import type { User, UserProfile } from "./user";

export interface PostWithComments extends Post {
	comments?: Comment[];
}

export interface UserWithExtras extends User {
	profile?: UserProfile;
	contributions?: Contribution[];
}

export interface FullDataExport {
	fetchedAt: string;
	communityId: string;
	groupId: string;
	metadata: {
		totalPosts: number;
		totalComments: number;
		totalUsers: number;
		totalProfiles: number;
		totalContributions: number;
		totalGroups: number;
		totalChannels: number;
	};
	community?: Community;
	groups: Group[];
	channels: Channel[];
	posts: PostWithComments[];
	users: UserWithExtras[];
	comments: Comment[];
	profiles: UserProfile[];
	contributions: Contribution[];
	gamification: {
		leaderboard: LeaderboardEntry[];
	};
}

export interface ScraperOptions {
	fetchPosts?: boolean;
	fetchComments?: boolean;
	fetchUsers?: boolean;
	fetchProfiles?: boolean;
	fetchContributions?: boolean;
	fetchGamification?: boolean;
	fetchCommunityInfo?: boolean;
	fetchChannels?: boolean;
	fetchNotifications?: boolean;
	maxCommentDepth?: number;
	delayMs?: number;
	/** Number of concurrent fetches for parallel operations (default: 5) */
	concurrency?: number;
	/** Enable verbose logging for comments */
	verboseComments?: boolean;
}
