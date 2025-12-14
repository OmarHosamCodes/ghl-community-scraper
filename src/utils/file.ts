import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
	CommentsExport,
	CommunityExport,
	FullDataExport,
	GamificationExport,
	PostsExport,
	UsersExport,
} from "../types";

/**
 * Export data to a JSON file
 */
export async function exportToJson<T>(
	data: T,
	outputPath: string,
): Promise<void> {
	// Ensure directory exists
	await mkdir(dirname(outputPath), { recursive: true });

	await writeFile(outputPath, JSON.stringify(data, null, 2));
	console.log(`💾 Exported to ${outputPath}`);
}

/**
 * Export posts to a JSON file
 * @deprecated Use exportToJson instead
 */
export async function exportPostsToJson(
	data: PostsExport,
	outputPath: string,
): Promise<void> {
	return exportToJson(data, outputPath);
}

/**
 * Create a posts export object
 */
export function createPostsExport(
	posts: PostsExport["posts"],
	communityId: string,
	groupId: string,
): PostsExport {
	return {
		fetchedAt: new Date().toISOString(),
		totalPosts: posts.length,
		communityId,
		groupId,
		posts,
	};
}

/**
 * Create a comments export object
 */
export function createCommentsExport(
	comments: CommentsExport["comments"],
	communityId: string,
	groupId: string,
	postId: string,
): CommentsExport {
	return {
		fetchedAt: new Date().toISOString(),
		totalComments: comments.length,
		communityId,
		groupId,
		postId,
		comments,
	};
}

/**
 * Create a users export object
 */
export function createUsersExport(
	users: UsersExport["users"],
	communityId: string,
	groupId: string,
): UsersExport {
	return {
		fetchedAt: new Date().toISOString(),
		totalUsers: users.length,
		communityId,
		groupId,
		users,
	};
}

/**
 * Export full data to multiple files
 */
export async function exportFullData(
	data: FullDataExport,
	outputDir: string = "output",
): Promise<void> {
	console.log("\n💾 Exporting data to files...\n");

	// Export full data
	await exportToJson(data, `${outputDir}/full-data.json`);

	// Export individual datasets for easier access
	if (data.community) {
		const communityExport: CommunityExport = {
			fetchedAt: data.fetchedAt,
			community: data.community,
		};
		await exportToJson(communityExport, `${outputDir}/community.json`);
	}

	if (data.posts.length > 0) {
		await exportToJson(
			{
				fetchedAt: data.fetchedAt,
				totalPosts: data.posts.length,
				communityId: data.communityId,
				groupId: data.groupId,
				posts: data.posts,
			},
			`${outputDir}/posts.json`,
		);
	}

	if (data.users.length > 0) {
		await exportToJson(
			{
				fetchedAt: data.fetchedAt,
				totalUsers: data.users.length,
				communityId: data.communityId,
				groupId: data.groupId,
				users: data.users,
			},
			`${outputDir}/users.json`,
		);
	}

	if (data.gamification.leaderboard.length > 0) {
		const gamificationExport: GamificationExport = {
			fetchedAt: data.fetchedAt,
			communityId: data.communityId,
			groupId: data.groupId,
			...data.gamification,
		};
		await exportToJson(gamificationExport, `${outputDir}/gamification.json`);
	}

	// Export comments separately
	if (data.comments && data.comments.length > 0) {
		await exportToJson(
			{
				fetchedAt: data.fetchedAt,
				totalComments: data.comments.length,
				communityId: data.communityId,
				groupId: data.groupId,
				comments: data.comments,
			},
			`${outputDir}/comments.json`,
		);
	}

	// Export profiles separately
	if (data.profiles && data.profiles.length > 0) {
		await exportToJson(
			{
				fetchedAt: data.fetchedAt,
				totalProfiles: data.profiles.length,
				communityId: data.communityId,
				groupId: data.groupId,
				profiles: data.profiles,
			},
			`${outputDir}/profiles.json`,
		);
	}

	// Export contributions separately
	if (data.contributions && data.contributions.length > 0) {
		await exportToJson(
			{
				fetchedAt: data.fetchedAt,
				totalContributions: data.contributions.length,
				communityId: data.communityId,
				groupId: data.groupId,
				contributions: data.contributions,
			},
			`${outputDir}/contributions.json`,
		);
	}

	console.log("\n✅ All data exported successfully!");
}
