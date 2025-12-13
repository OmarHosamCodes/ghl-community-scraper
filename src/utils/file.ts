import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PostsExport } from "../types";

/**
 * Export posts to a JSON file
 */
export async function exportPostsToJson(
	data: PostsExport,
	outputPath: string,
): Promise<void> {
	// Ensure directory exists
	await mkdir(dirname(outputPath), { recursive: true });

	await writeFile(outputPath, JSON.stringify(data, null, 2));
	console.log(`💾 Exported to ${outputPath}`);
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
