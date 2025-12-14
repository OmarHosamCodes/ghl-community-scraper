import { env } from "../config/env";
import type {
	FullDataExport,
	PostWithComments,
	ScraperOptions,
} from "../types";
import { CommentsService } from "./comments";
import { CommunityService } from "./community";
import { GamificationService } from "./gamification";
import { PostsService } from "./posts";
import { UsersService } from "./users";

/**
 * Main scraper service that orchestrates fetching all community data
 */
export class ScraperService {
	private postsService: PostsService;
	private commentsService: CommentsService;
	private usersService: UsersService;
	private gamificationService: GamificationService;
	private communityService: CommunityService;

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {
		this.postsService = new PostsService(communityId, groupId);
		this.commentsService = new CommentsService(communityId, groupId);
		this.usersService = new UsersService(communityId, groupId);
		this.gamificationService = new GamificationService(communityId, groupId);
		this.communityService = new CommunityService(communityId, groupId);
	}

	/**
	 * Fetch all data from the community
	 */
	async fetchAll(options: ScraperOptions = {}): Promise<FullDataExport> {
		const {
			fetchPosts = true,
			fetchComments = true,
			fetchUsers = true,
			fetchGamification = true,
			fetchCommunityInfo = true,
			maxCommentDepth = 10,
			delayMs = env.fetchDelayMs,
		} = options;

		console.log("🚀 Starting full community data scrape...\n");
		console.log("Options:", {
			fetchPosts,
			fetchComments,
			fetchUsers,
			fetchGamification,
			fetchCommunityInfo,
			maxCommentDepth,
			delayMs,
		});
		console.log("\n" + "=".repeat(60) + "\n");

		// Initialize result structure
		const result: FullDataExport = {
			fetchedAt: new Date().toISOString(),
			communityId: this.communityId,
			groupId: this.groupId,
			metadata: {
				totalPosts: 0,
				totalComments: 0,
				totalUsers: 0,
				totalGroups: 0,
				totalChannels: 0,
			},
			groups: [],
			channels: [],
			posts: [],
			users: [],
			gamification: {
				leaderboard: [],
				badges: [],
				levels: [],
				pointActions: [],
			},
		};

		// Fetch community info
		if (fetchCommunityInfo) {
			console.log("📍 STEP 1: Fetching community information...\n");
			const communityData = await this.communityService.fetchAll({ delayMs });
			result.community = communityData.community;
			result.groups = communityData.groups;
			result.channels = communityData.channels;
			result.metadata.totalGroups = communityData.groups.length;
			result.metadata.totalChannels = communityData.channels.length;
			console.log("\n" + "=".repeat(60) + "\n");
		}

		// Fetch posts
		let postsWithComments: PostWithComments[] = [];
		if (fetchPosts) {
			console.log("📍 STEP 2: Fetching posts...\n");
			const posts = await this.postsService.fetchAll({ delayMs });
			postsWithComments = posts.map((post) => ({ ...post }));
			result.metadata.totalPosts = posts.length;
			console.log("\n" + "=".repeat(60) + "\n");

			// Fetch comments for each post
			if (fetchComments && posts.length > 0) {
				console.log("📍 STEP 3: Fetching comments for all posts...\n");
				let totalComments = 0;

				for (const post of postsWithComments) {
					const postIndex = postsWithComments.indexOf(post);
					console.log(
						`\n📝 Processing post ${postIndex + 1}/${postsWithComments.length}: "${post.title || post._id}"`,
					);

					if (post.commentsCount > 0) {
						const comments = await this.commentsService.fetchAllWithReplies(
							post._id,
							{ delayMs, maxDepth: maxCommentDepth },
						);
						post.comments = comments;
						const commentCount =
							this.commentsService.countTotalComments(comments);
						totalComments += commentCount;
						console.log(
							`    ✅ Fetched ${commentCount} total comments (including replies)`,
						);
					} else {
						post.comments = [];
						console.log("    ⏭️ No comments to fetch");
					}

					await Bun.sleep(delayMs);
				}

				result.metadata.totalComments = totalComments;
				console.log(`\n📊 Total comments fetched: ${totalComments}`);
				console.log("\n" + "=".repeat(60) + "\n");
			}
		}

		result.posts = postsWithComments;

		// Fetch users
		if (fetchUsers) {
			console.log("📍 STEP 4: Fetching users/members...\n");
			const users = await this.usersService.fetchAll({ delayMs });
			result.users = users;
			result.metadata.totalUsers = users.length;
			console.log("\n" + "=".repeat(60) + "\n");
		}

		// Fetch gamification data
		if (fetchGamification) {
			console.log("📍 STEP 5: Fetching gamification data...\n");
			const gamificationData = await this.gamificationService.fetchAll({
				delayMs,
			});
			result.gamification = {
				leaderboard: gamificationData.leaderboard,
				badges: gamificationData.badges,
				levels: gamificationData.levels,
				pointActions: gamificationData.pointActions,
			};
			console.log("\n" + "=".repeat(60) + "\n");
		}

		// Print summary
		console.log("📊 SCRAPE SUMMARY:");
		console.log("=".repeat(40));
		console.log(`  Community: ${result.community?.name ?? this.communityId}`);
		console.log(`  Groups: ${result.metadata.totalGroups}`);
		console.log(`  Channels: ${result.metadata.totalChannels}`);
		console.log(`  Posts: ${result.metadata.totalPosts}`);
		console.log(`  Comments: ${result.metadata.totalComments}`);
		console.log(`  Users: ${result.metadata.totalUsers}`);
		console.log(
			`  Leaderboard entries: ${result.gamification.leaderboard.length}`,
		);
		console.log(`  Badges: ${result.gamification.badges.length}`);
		console.log(`  Levels: ${result.gamification.levels.length}`);
		console.log("=".repeat(40));

		return result;
	}

	/**
	 * Get all services for individual access
	 */
	getServices() {
		return {
			posts: this.postsService,
			comments: this.commentsService,
			users: this.usersService,
			gamification: this.gamificationService,
			community: this.communityService,
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
