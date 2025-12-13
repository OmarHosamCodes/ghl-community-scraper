import { PostsService } from "./services";
import { createPostsExport, exportPostsToJson } from "./utils";

async function main() {
	try {
		const postsService = new PostsService();
		const posts = await postsService.fetchAll();
		const { communityId, groupId } = postsService.getInfo();

		console.log(`\n📊 Total posts fetched: ${posts.length}`);

		const exportData = createPostsExport(posts, communityId, groupId);
		await exportPostsToJson(exportData, "output/posts.json");
	} catch (error) {
		console.error("Fatal error:", error);
		process.exit(1);
	}
}

main();
