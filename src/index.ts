import { ScraperService } from "./services";
import type { ScraperOptions } from "./types";
import { exportFullData } from "./utils";

async function main() {
	try {
		// Configure what to fetch
		const options: ScraperOptions = {
			fetchPosts: true,
			fetchComments: true,
			fetchUsers: false,
			fetchGamification: false,
			fetchCommunityInfo: false,
			maxCommentDepth: 10, // Maximum depth for recursive comment fetching
		};

		// Create scraper and fetch all data
		const scraper = new ScraperService();
		const data = await scraper.fetchAll(options);

		// Export all data to files
		await exportFullData(data, "output");

		console.log("\n🎉 Scraping completed successfully!");
	} catch (error) {
		console.error("Fatal error:", error);
		process.exit(1);
	}
}

main();
