import { ScraperService } from "./services";
import type { ScraperOptions } from "./types";
import { exportFullData } from "./utils";

async function main() {
	try {
		// Configure what to fetch
		const options: ScraperOptions = {
			fetchPosts: false,
			fetchComments: false,
			fetchUsers: false,
			fetchProfiles: false,
			fetchContributions: false,
			fetchGamification: false,
			fetchCommunityInfo: false,
			fetchChannels: true,
			fetchNotifications: false,
			maxCommentDepth: 100, // Maximum depth for recursive comment fetching
			concurrency: 500, // Number of concurrent fetches for parallel operations
		};

		// Create scraper and fetch all data
		const scraper = new ScraperService();
		const data = await scraper.fetchAll(options);

		// Export all data to files
		await exportFullData(data, "output");

		// Fetch and save notifications separately
		if (options.fetchNotifications) {
			await scraper.fetchNotifications("output");
		}

		console.log("\n🎉 Scraping completed successfully!");
	} catch (error) {
		console.error("Fatal error:", error);
		process.exit(1);
	}
}

main();
