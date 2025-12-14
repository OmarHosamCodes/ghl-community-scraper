#!/usr/bin/env bun
/**
 * CLI Entry Point
 * Interactive command-line interface for GHL Community Scraper
 */
import pc from "picocolors";
import {
	formatElapsedTime,
	showBanner,
	showCompletion,
	showConfig,
	showEnvSetupInstructions,
	showError,
	showInfo,
	showStep,
	showSuccess,
	showSummaryTable,
} from "./cli/display";
import { createSingleBar, Spinner } from "./cli/progress";
import {
	buildOptions,
	type CliOptions,
	confirmStart,
	getAdvancedOptions,
	selectFeatures,
	showIntro,
	showOptionsSummary,
	showOutro,
} from "./cli/prompts";
import { env } from "./config/env";
import { ScraperService } from "./services";
import type {
	Comment,
	Contribution,
	FullDataExport,
	PostWithComments,
	UserProfile,
	UserWithExtras,
} from "./types";
import { exportFullData } from "./utils";

/**
 * Check if environment is properly configured
 */
function checkEnvironment(): boolean {
	try {
		// env is already parsed and validated by zod
		// If we get here, env vars are valid
		return Boolean(env.communityId && env.groupId && env.tokenId);
	} catch {
		return false;
	}
}

/**
 * Run the interactive CLI scraper
 */
async function runInteractiveScraper(options: CliOptions): Promise<void> {
	const startTime = Date.now();
	const scraper = new ScraperService();
	const totalSteps = countEnabledSteps(options);
	let currentStep = 0;

	// Initialize result structure
	const result: FullDataExport = {
		fetchedAt: new Date().toISOString(),
		communityId: env.communityId,
		groupId: env.groupId,
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
		},
	};

	const services = scraper.getServices();

	// Step: Community Info
	if (options.fetchCommunityInfo) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching community information...");

		const spinner = new Spinner("Loading community data...");
		spinner.start();

		try {
			const communityData = await services.community.fetchAll({
				delayMs: options.delayMs,
			});
			result.community = communityData.community;
			spinner.stop(true);
			showSuccess(
				`Community: ${pc.bold(result.community?.name || env.communityId)}`,
			);
		} catch (error) {
			spinner.stop(false);
			showError(`Failed to fetch community info: ${error}`);
		}
	}

	// Step: Posts
	let postsWithComments: PostWithComments[] = [];
	if (options.fetchPosts) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching posts...");

		const postsSpinner = new Spinner("Fetching posts...");
		postsSpinner.start();

		try {
			const posts = await services.posts.fetchAll({
				delayMs: options.delayMs,
			});
			postsWithComments = posts.map((post) => ({ ...post }));
			result.metadata.totalPosts = posts.length;
			postsSpinner.stop(true);
			showSuccess(`Fetched ${pc.bold(posts.length.toLocaleString())} posts`);
		} catch (error) {
			postsSpinner.stop(false);
			showError(`Failed to fetch posts: ${error}`);
		}

		// Step: Comments (if posts were fetched)
		if (options.fetchComments && postsWithComments.length > 0) {
			currentStep++;
			showStep(currentStep, totalSteps, "Fetching comments...");

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

			showInfo(
				`${postsWithCommentsToFetch.length} posts have comments to fetch`,
			);

			if (postsWithCommentsToFetch.length > 0) {
				const progressBar = createSingleBar(
					"comments",
					postsWithCommentsToFetch.length,
				);

				let processed = 0;
				const {
					concurrency = 500,
					maxCommentDepth = 10,
					delayMs = 100,
				} = options;

				for (let i = 0; i < postsWithCommentsToFetch.length; i += concurrency) {
					const batch = postsWithCommentsToFetch.slice(i, i + concurrency);

					await Promise.all(
						batch.map(async (post) => {
							const comments = await services.comments.fetchAllWithReplies(
								post._id,
								{
									delayMs: 50,
									maxDepth: maxCommentDepth,
									concurrency: 5,
									verbose: false,
								},
							);
							post.comments = comments;
							processed++;
							progressBar.update(processed);
						}),
					);

					if (i + concurrency < postsWithCommentsToFetch.length) {
						await Bun.sleep(delayMs);
					}
				}

				progressBar.stop();

				const totalComments = postsWithComments.reduce(
					(sum, post) =>
						sum + services.comments.countTotalComments(post.comments || []),
					0,
				);
				result.metadata.totalComments = totalComments;
				showSuccess(
					`Fetched ${pc.bold(totalComments.toLocaleString())} comments`,
				);
			}
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

	// Step: Channels (if not fetched with community info)
	if (options.fetchChannels && !options.fetchCommunityInfo) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching channels...");

		const channelsSpinner = new Spinner("Fetching channels...");
		channelsSpinner.start();

		try {
			const channels = await services.channels.fetchAll();
			result.channels = channels;
			result.metadata.totalChannels = channels.length;
			channelsSpinner.stop(true);
			showSuccess(`Fetched ${pc.bold(channels.length.toString())} channels`);
		} catch (error) {
			channelsSpinner.stop(false);
			showError(`Failed to fetch channels: ${error}`);
		}
	}

	// Step: Users
	const usersWithExtras: UserWithExtras[] = [];
	const allProfiles: UserProfile[] = [];
	const allContributions: Contribution[] = [];

	if (options.fetchUsers) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching users...");

		const usersSpinner = new Spinner("Fetching users...");
		usersSpinner.start();

		let users: UserWithExtras[] = [];
		try {
			users = (await services.users.fetchAll()) as UserWithExtras[];
			result.metadata.totalUsers = users.length;
			usersSpinner.stop(true);
			showSuccess(`Fetched ${pc.bold(users.length.toLocaleString())} users`);
		} catch (error) {
			usersSpinner.stop(false);
			showError(`Failed to fetch users: ${error}`);
		}

		// Step: User Profiles and Contributions
		if (
			(options.fetchProfiles || options.fetchContributions) &&
			users.length > 0
		) {
			currentStep++;
			const profilesLabel = options.fetchProfiles ? "profiles" : "";
			const contributionsLabel = options.fetchContributions
				? "contributions"
				: "";
			const separator =
				options.fetchProfiles && options.fetchContributions ? " and " : "";
			showStep(
				currentStep,
				totalSteps,
				`Fetching ${profilesLabel}${separator}${contributionsLabel}...`,
			);

			const progressBar = createSingleBar("profiles", users.length);

			let completed = 0;
			const { concurrency = 50, delayMs = 100 } = options;

			for (let i = 0; i < users.length; i += concurrency) {
				const batch = users.slice(i, i + concurrency);

				await Promise.all(
					batch.map(async (user) => {
						const userWithExtras: UserWithExtras = { ...user };

						// Fetch profile
						if (options.fetchProfiles) {
							const profile = await services.users.fetchProfile(user.contactId);
							if (profile) {
								userWithExtras.profile = profile;
								allProfiles.push(profile);
							}
						}

						// Fetch contributions
						if (options.fetchContributions) {
							const contributions = await services.contributions.fetchAll(
								user.contactId,
								{ delayMs: 50 },
							);
							userWithExtras.contributions = contributions;
							allContributions.push(...contributions);
						}

						usersWithExtras.push(userWithExtras);
						completed++;
						progressBar.update(completed);
					}),
				);

				if (i + concurrency < users.length) {
					await Bun.sleep(delayMs);
				}
			}

			progressBar.stop();
			result.metadata.totalProfiles = allProfiles.length;
			result.metadata.totalContributions = allContributions.length;
			showSuccess(
				`Fetched ${pc.bold(allProfiles.length.toString())} profiles, ${pc.bold(allContributions.length.toLocaleString())} contributions`,
			);
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

	// Step: Gamification
	if (options.fetchGamification) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching gamification data...");

		const gamificationSpinner = new Spinner("Fetching leaderboard...");
		gamificationSpinner.start();

		try {
			const gamificationData = await services.gamification.fetchAll({
				delayMs: options.delayMs,
			});
			result.gamification = {
				leaderboard: gamificationData.leaderboard,
			};
			gamificationSpinner.stop(true);
			showSuccess(
				`Fetched ${pc.bold(gamificationData.leaderboard.length.toString())} leaderboard entries`,
			);
		} catch (error) {
			gamificationSpinner.stop(false);
			showError(`Failed to fetch gamification: ${error}`);
		}
	}

	// Step: Notifications
	if (options.fetchNotifications) {
		currentStep++;
		showStep(currentStep, totalSteps, "Fetching notifications...");

		const notificationsSpinner = new Spinner("Fetching notifications...");
		notificationsSpinner.start();

		try {
			await scraper.fetchNotifications(options.outputDir);
			notificationsSpinner.stop(true);
			showSuccess("Notifications saved to currentUserNotification.json");
		} catch (error) {
			notificationsSpinner.stop(false);
			showError(`Failed to fetch notifications: ${error}`);
		}
	}

	// Export data
	console.log();
	const exportSpinner = new Spinner("Exporting data to JSON files...");
	exportSpinner.start();

	try {
		await exportFullData(result, options.outputDir);
		exportSpinner.stop(true);
	} catch (error) {
		exportSpinner.stop(false);
		showError(`Failed to export data: ${error}`);
	}

	// Show summary
	const elapsedTime = formatElapsedTime(startTime);
	showSummaryTable(result, elapsedTime, options.outputDir);
	showCompletion();
}

/**
 * Count enabled steps for progress tracking
 */
function countEnabledSteps(options: CliOptions): number {
	let count = 0;
	if (options.fetchCommunityInfo) count++;
	if (options.fetchPosts) count++;
	if (options.fetchComments && options.fetchPosts) count++;
	if (options.fetchChannels && !options.fetchCommunityInfo) count++;
	if (options.fetchUsers) count++;
	if (
		(options.fetchProfiles || options.fetchContributions) &&
		options.fetchUsers
	)
		count++;
	if (options.fetchGamification) count++;
	if (options.fetchNotifications) count++;
	return count;
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
	// Clear console and show banner
	console.clear();
	showBanner();

	// Check environment
	if (!checkEnvironment()) {
		showEnvSetupInstructions();
		process.exit(1);
	}

	// Show current config
	showConfig({
		communityId: env.communityId,
		groupId: env.groupId,
		groupSlug: env.groupSlug,
		fetchLimit: env.fetchLimit,
		fetchDelayMs: env.fetchDelayMs,
	});

	// Show intro and get confirmation
	const shouldContinue = await showIntro();
	if (!shouldContinue) {
		process.exit(0);
	}

	// Select features
	const features = await selectFeatures();
	if (!features) {
		process.exit(0);
	}

	// Get advanced options
	const advancedOptions = await getAdvancedOptions();
	if (!advancedOptions) {
		process.exit(0);
	}

	// Build options
	const options = buildOptions(features, advancedOptions);

	// Show summary
	showOptionsSummary(options);

	// Confirm start
	const confirmed = await confirmStart();
	if (!confirmed) {
		process.exit(0);
	}

	// Run scraper
	console.log("\n");
	try {
		await runInteractiveScraper(options);
		showOutro(true, options.outputDir);
	} catch (error) {
		showError(`Fatal error: ${error}`);
		showOutro(false, options.outputDir);
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log(pc.yellow("\n\n⚠ Interrupted by user"));
	process.exit(0);
});

main();
