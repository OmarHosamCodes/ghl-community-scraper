import { env } from "../config/env";
import type {
	Comment,
	Contribution,
	FullDataExport,
	PostWithComments,
	ScraperOptions,
	UserProfile,
	UserWithExtras,
} from "../types";
import { ChannelsService } from "./channels";
import { CommentsService } from "./comments";
import { CommunityService } from "./community";
import { ContributionsService } from "./contributions";
import { GamificationService } from "./gamification";
import { NotificationsService } from "./notifications";
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
	private channelsService: ChannelsService;
	private contributionsService: ContributionsService;
	private notificationsService: NotificationsService;

	constructor(
		private communityId: string = env.communityId,
		private groupId: string = env.groupId,
	) {
		this.postsService = new PostsService(communityId, groupId);
		this.commentsService = new CommentsService(communityId, groupId);
		this.usersService = new UsersService(communityId, groupId);
		this.gamificationService = new GamificationService(communityId, groupId);
		this.communityService = new CommunityService(communityId, groupId);
		this.channelsService = new ChannelsService(communityId, groupId);
		this.contributionsService = new ContributionsService(communityId, groupId);
		this.notificationsService = new NotificationsService(communityId, groupId);
	}

	/**
	 * Fetch all data from the community
	 */
	async fetchAll(options: ScraperOptions = {}): Promise<FullDataExport> {
		const {
			fetchPosts = true,
			fetchComments = true,
			fetchUsers = true,
			fetchProfiles = true,
			fetchContributions = true,
			fetchGamification = true,
			fetchCommunityInfo = true,
			fetchChannels = true,
			fetchNotifications = true,
			maxCommentDepth = 10,
			delayMs = env.fetchDelayMs,
			concurrency = 5,
			verboseComments = false,
		} = options;

		console.log("🚀 Starting full community data scrape...\n");
		console.log("Options:", {
			fetchPosts,
			fetchComments,
			fetchUsers,
			fetchProfiles,
			fetchContributions,
			fetchGamification,
			fetchCommunityInfo,
			fetchChannels,
			fetchNotifications,
			maxCommentDepth,
			delayMs,
			concurrency,
		});
		console.log(`\n${"=".repeat(60)}\n`);

		// Initialize result structure
		const result: FullDataExport = {
			fetchedAt: new Date().toISOString(),
			communityId: this.communityId,
			groupId: this.groupId,
			metadata: {
				totalPosts: 0,
				totalComments: 0,
				totalUsers: 0,
				totalProfiles: 0,
				totalContributions: 0,
				totalGroups: 0,
				totalChannels: 0,
			},
			groups: [],
			channels: [],
			posts: [],
			users: [],
			comments: [],
			profiles: [],
			contributions: [],
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

			console.log(`\n${"=".repeat(60)}\n`);
		}

		// Fetch posts
		let postsWithComments: PostWithComments[] = [];
		if (fetchPosts) {
			console.log("📍 STEP 2: Fetching posts...\n");
			const posts = await this.postsService.fetchAll({ delayMs });
			postsWithComments = posts.map((post) => ({ ...post }));
			result.metadata.totalPosts = posts.length;
			console.log(`\n${"=".repeat(60)}\n`);

			// Fetch comments for each post - parallelized
			if (fetchComments && posts.length > 0) {
				console.log("📍 STEP 3: Fetching comments for all posts...\n");

				// Filter posts that have comments
				const postsWithCommentsToFetch = postsWithComments.filter(
					(p) => p.commentsCount > 0,
				);
				const postsWithoutComments = postsWithComments.filter(
					(p) => p.commentsCount === 0,
				);

				// Initialize posts without comments
				for (const post of postsWithoutComments) {
					post.comments = [];
				}

				console.log(
					`    📊 ${postsWithCommentsToFetch.length} posts have comments to fetch`,
				);

				// Process posts in parallel batches
				let processed = 0;
				const totalToProcess = postsWithCommentsToFetch.length;

				for (let i = 0; i < totalToProcess; i += concurrency) {
					const batch = postsWithCommentsToFetch.slice(i, i + concurrency);

					await Promise.all(
						batch.map(async (post) => {
							const comments = await this.commentsService.fetchAllWithReplies(
								post._id,
								{
									delayMs: 100,
									maxDepth: maxCommentDepth,
									concurrency: 5,
									verbose: verboseComments,
								},
							);
							post.comments = comments;
							processed++;
							const commentCount =
								this.commentsService.countTotalComments(comments);
							console.log(
								`    ✅ [${processed}/${totalToProcess}] "${post.title || post._id}": ${commentCount} comments`,
							);
						}),
					);

					// Small delay between batches
					if (i + concurrency < totalToProcess) {
						await Bun.sleep(delayMs);
					}
				}

				const totalComments = postsWithComments.reduce(
					(sum, post) =>
						sum + this.commentsService.countTotalComments(post.comments || []),
					0,
				);
				result.metadata.totalComments = totalComments;
				console.log(`\n📊 Total comments fetched: ${totalComments}`);
				console.log(`\n${"=".repeat(60)}\n`);
			}
		}

		result.posts = postsWithComments;

		// Collect all comments separately for export
		const allComments: Comment[] = [];
		for (const post of postsWithComments) {
			if (post.comments) {
				const flattenComments = (comments: Comment[]): void => {
					for (const comment of comments) {
						allComments.push(comment);
						if (comment.replies) {
							flattenComments(comment.replies);
						}
					}
				};
				flattenComments(post.comments);
			}
		}
		result.comments = allComments;

		// Fetch channels (single request)
		if (fetchChannels && !fetchCommunityInfo) {
			console.log("📍 STEP 3.5: Fetching channels...\n");
			const channels = await this.channelsService.fetchAll();
			result.channels = channels;
			result.metadata.totalChannels = channels.length;
			console.log(`\n${"=".repeat(60)}\n`);
		}

		// Fetch users
		const usersWithExtras: UserWithExtras[] = [];
		const allProfiles: UserProfile[] = [];
		const allContributions: Contribution[] = [];

		if (fetchUsers) {
			console.log("📍 STEP 4: Fetching users/members...\n");
			const users = await this.usersService.fetchAll();
			result.metadata.totalUsers = users.length;
			console.log(`\n${"=".repeat(60)}\n`);

			// Fetch profiles and contributions for users with parallel processing
			if ((fetchProfiles || fetchContributions) && users.length > 0) {
				console.log(
					`📍 STEP 4.1: Fetching user profiles${fetchContributions ? " and contributions" : ""} (concurrency: ${concurrency})...\n`,
				);

				let completed = 0;
				const total = users.length;

				// Process users in parallel batches
				for (let i = 0; i < total; i += concurrency) {
					const batch = users.slice(i, i + concurrency);

					await Promise.all(
						batch.map(async (user) => {
							const userWithExtras: UserWithExtras = { ...user };

							// Fetch profile
							if (fetchProfiles) {
								const profile = await this.usersService.fetchProfile(
									user.contactId,
								);
								if (profile) {
									userWithExtras.profile = profile;
									allProfiles.push(profile);
								}
							}

							// Fetch contributions
							if (fetchContributions) {
								const contributions = await this.contributionsService.fetchAll(
									user._id,
									{ delayMs: 50 },
								);
								userWithExtras.contributions = contributions;
								allContributions.push(...contributions);
							}

							usersWithExtras.push(userWithExtras);
							completed++;
							console.log(`📊 Progress: ${completed}/${total} users processed`);
						}),
					);

					// Small delay between batches
					if (i + concurrency < total) {
						await Bun.sleep(delayMs);
					}
				}

				result.metadata.totalProfiles = allProfiles.length;
				result.metadata.totalContributions = allContributions.length;
				console.log(`\n${"=".repeat(60)}\n`);
			} else {
				// Just add users without extras
				for (const user of users) {
					usersWithExtras.push({ ...user });
				}
			}
		}

		result.users = usersWithExtras;
		result.profiles = allProfiles;
		result.contributions = allContributions;

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
			console.log(`\n${"=".repeat(60)}\n`);
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
		console.log(`  Profiles: ${result.metadata.totalProfiles}`);
		console.log(`  Contributions: ${result.metadata.totalContributions}`);
		console.log(
			`  Leaderboard entries: ${result.gamification.leaderboard.length}`,
		);
		console.log(`  Badges: ${result.gamification.badges.length}`);
		console.log(`  Levels: ${result.gamification.levels.length}`);
		console.log("=".repeat(40));

		return result;
	}

	/**
	 * Fetch notifications for the current user and save to file
	 */
	async fetchNotifications(outputDir: string = "output"): Promise<void> {
		console.log("🔔 Fetching current user notifications...\n");
		const notifications = await this.notificationsService.fetchAll();

		const { exportToJson } = await import("../utils/file");
		await exportToJson(
			{
				fetchedAt: new Date().toISOString(),
				totalNotifications: notifications.length,
				notifications,
			},
			`${outputDir}/currentUserNotification.json`,
		);

		console.log(
			`✅ Saved ${notifications.length} notifications to currentUserNotification.json`,
		);
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
			channels: this.channelsService,
			contributions: this.contributionsService,
			notifications: this.notificationsService,
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
