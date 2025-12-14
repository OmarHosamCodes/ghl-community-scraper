/**
 * CLI Display Utilities
 * Handles banners, tables, colorized output, and formatting
 */

import Table from "cli-table3";
import pc from "picocolors";
import type { FullDataExport } from "../types";

/**
 * Display the welcome banner
 */
export function showBanner(): void {
	const banner = `
${pc.cyan(`╭${"─".repeat(56)}╮`)}
${pc.cyan("│")}                                                        ${pc.cyan("│")}
${pc.cyan("│")}   ${pc.bold(pc.magenta("🔮 GHL Community Scraper"))}                             ${pc.cyan("│")}
${pc.cyan("│")}   ${pc.dim("Fetch data from GoHighLevel communities")}              ${pc.cyan("│")}
${pc.cyan("│")}                                                        ${pc.cyan("│")}
${pc.cyan(`╰${"─".repeat(56)}╯`)}
`;
	console.log(banner);
}

/**
 * Display current configuration
 */
export function showConfig(config: {
	communityId: string;
	groupId: string;
	groupSlug: string;
	fetchLimit: number;
	fetchDelayMs: number;
}): void {
	console.log(pc.dim("─".repeat(56)));
	console.log(`  ${pc.blue("◆")} Community ID: ${pc.bold(config.communityId)}`);
	console.log(`  ${pc.blue("◆")} Group ID:     ${pc.bold(config.groupId)}`);
	console.log(`  ${pc.blue("◆")} Group Slug:   ${pc.bold(config.groupSlug)}`);
	console.log(pc.dim("─".repeat(56)));
	console.log();
}

/**
 * Display a step header
 */
export function showStep(step: number, total: number, message: string): void {
	console.log(
		`\n${pc.cyan("📍")} ${pc.bold(`STEP ${step}/${total}`)}: ${message}\n`,
	);
}

/**
 * Display a success message
 */
export function showSuccess(message: string): void {
	console.log(`${pc.green("✓")} ${message}`);
}

/**
 * Display an error message
 */
export function showError(message: string): void {
	console.log(`${pc.red("✗")} ${pc.red(message)}`);
}

/**
 * Display a warning message
 */
export function showWarning(message: string): void {
	console.log(`${pc.yellow("⚠")} ${pc.yellow(message)}`);
}

/**
 * Display an info message
 */
export function showInfo(message: string): void {
	console.log(`${pc.blue("ℹ")} ${message}`);
}

/**
 * Display the final summary table
 */
export function showSummaryTable(
	data: FullDataExport,
	elapsedTime: string,
	outputDir: string,
): void {
	const table = new Table({
		chars: {
			top: "─",
			"top-mid": "┬",
			"top-left": "┌",
			"top-right": "┐",
			bottom: "─",
			"bottom-mid": "┴",
			"bottom-left": "└",
			"bottom-right": "┘",
			left: "│",
			"left-mid": "├",
			mid: "─",
			"mid-mid": "┼",
			right: "│",
			"right-mid": "┤",
			middle: "│",
		},
		colWidths: [25, 30],
		style: {
			head: ["cyan"],
			border: ["dim"],
		},
	});

	table.push(
		[{ colSpan: 2, content: pc.bold("📊 SCRAPE SUMMARY"), hAlign: "center" }],
		[pc.cyan("Community"), data.community?.name ?? data.communityId],
		[pc.cyan("Posts"), formatNumber(data.metadata.totalPosts)],
		[pc.cyan("Comments"), formatNumber(data.metadata.totalComments)],
		[pc.cyan("Users"), formatNumber(data.metadata.totalUsers)],
		[pc.cyan("Profiles"), formatNumber(data.metadata.totalProfiles)],
		[pc.cyan("Contributions"), formatNumber(data.metadata.totalContributions)],
		[pc.cyan("Channels"), formatNumber(data.metadata.totalChannels)],
		[
			pc.cyan("Leaderboard"),
			formatNumber(data.gamification.leaderboard.length),
		],
		[pc.dim("─".repeat(23)), pc.dim("─".repeat(28))],
		[pc.green("Time Elapsed"), pc.bold(elapsedTime)],
		[pc.green("Output"), pc.bold(`./${outputDir}/`)],
	);

	console.log(`\n${table.toString()}\n`);
}

/**
 * Display a completion message
 */
export function showCompletion(): void {
	console.log(pc.bold(pc.green("\n🎉 Scraping completed successfully!\n")));
}

/**
 * Display environment setup instructions
 */
export function showEnvSetupInstructions(): void {
	console.log(`
${pc.yellow("⚠")} ${pc.bold("Environment Setup Required")}

Create a ${pc.cyan(".env")} file with the following variables:

${pc.dim("─".repeat(45))}
${pc.green("COMMUNITY_ID")}=${pc.dim("your_community_id")}
${pc.green("GROUP_ID")}=${pc.dim("your_group_id")}
${pc.green("GROUP_SLUG")}=${pc.dim("your_group_slug")}
${pc.green("TOKEN_ID")}=${pc.dim("your_token_id")}
${pc.green("FETCH_LIMIT")}=${pc.dim("20")}
${pc.green("FETCH_DELAY_MS")}=${pc.dim("500")}
${pc.dim("─".repeat(45))}

You can copy ${pc.cyan(".env.example")} as a starting point:
  ${pc.dim("$")} ${pc.cyan("cp .env.example .env")}
`);
}

/**
 * Format a number with thousands separators
 */
function formatNumber(num: number): string {
	return num.toLocaleString();
}

/**
 * Format elapsed time
 */
export function formatElapsedTime(startTime: number): string {
	const elapsed = Date.now() - startTime;
	const seconds = Math.floor(elapsed / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}
