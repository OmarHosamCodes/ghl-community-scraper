/**
 * CLI Interactive Prompts
 * Handles user input and configuration using @clack/prompts
 */
import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ScraperOptions } from "../types";

export interface CliOptions extends ScraperOptions {
	outputDir: string;
}

export interface ScraperFeature {
	id: keyof ScraperOptions;
	label: string;
	icon: string;
	hint?: string;
}

const scraperFeatures: ScraperFeature[] = [
	{
		id: "fetchPosts",
		label: "Posts",
		icon: "📝",
		hint: "Fetch all posts from the community",
	},
	{
		id: "fetchComments",
		label: "Comments",
		icon: "💬",
		hint: "Fetch comments with nested replies",
	},
	{
		id: "fetchUsers",
		label: "Users",
		icon: "👥",
		hint: "Fetch all community members",
	},
	{
		id: "fetchProfiles",
		label: "User Profiles",
		icon: "👤",
		hint: "Fetch detailed user profiles",
	},
	{
		id: "fetchContributions",
		label: "Contributions",
		icon: "📊",
		hint: "Fetch user contribution history",
	},
	{
		id: "fetchGamification",
		label: "Gamification",
		icon: "🏆",
		hint: "Leaderboard, badges, levels",
	},
	{
		id: "fetchCommunityInfo",
		label: "Community Info",
		icon: "🏠",
		hint: "Community details and groups",
	},
	{
		id: "fetchChannels",
		label: "Channels",
		icon: "📺",
		hint: "Fetch community channels",
	},
	{
		id: "fetchNotifications",
		label: "Notifications",
		icon: "🔔",
		hint: "Fetch current user notifications",
	},
];

/**
 * Display intro and get user confirmation to proceed
 */
export async function showIntro(): Promise<boolean> {
	p.intro(pc.bgCyan(pc.black(" GHL Community Scraper ")));

	const shouldContinue = await p.confirm({
		message: "Ready to configure and start scraping?",
		initialValue: true,
	});

	if (p.isCancel(shouldContinue) || !shouldContinue) {
		p.cancel("Operation cancelled");
		return false;
	}

	return true;
}

/**
 * Prompt user to select which features to scrape
 */
export async function selectFeatures(): Promise<
	(keyof ScraperOptions)[] | null
> {
	const features = await p.multiselect({
		message: "What would you like to scrape?",
		options: scraperFeatures.map((f) => ({
			value: f.id,
			label: `${f.icon} ${f.label}`,
			hint: f.hint,
		})),
		initialValues: [
			"fetchPosts",
			"fetchComments",
			"fetchUsers",
		] as (keyof ScraperOptions)[],
		required: true,
	});

	if (p.isCancel(features)) {
		p.cancel("Operation cancelled");
		return null;
	}

	return features as (keyof ScraperOptions)[];
}

/**
 * Prompt user for advanced options
 */
export async function getAdvancedOptions(): Promise<{
	concurrency: number;
	maxCommentDepth: number;
	delayMs: number;
	outputDir: string;
} | null> {
	const wantAdvanced = await p.confirm({
		message: "Would you like to configure advanced options?",
		initialValue: false,
	});

	if (p.isCancel(wantAdvanced)) {
		p.cancel("Operation cancelled");
		return null;
	}

	if (!wantAdvanced) {
		return {
			concurrency: 50,
			maxCommentDepth: 100,
			delayMs: 100,
			outputDir: "output",
		};
	}

	const advancedGroup = await p.group(
		{
			concurrency: () =>
				p.text({
					message: "Concurrent requests (1-100)",
					placeholder: "50",
					defaultValue: "50",
					validate: (value) => {
						const num = Number.parseInt(value, 10);
						if (Number.isNaN(num) || num < 1 || num > 100) {
							return "Please enter a number between 1 and 100";
						}
					},
				}),
			maxCommentDepth: () =>
				p.text({
					message: "Maximum comment depth (1-200)",
					placeholder: "100",
					defaultValue: "100",
					validate: (value) => {
						const num = Number.parseInt(value, 10);
						if (Number.isNaN(num) || num < 1 || num > 200) {
							return "Please enter a number between 1 and 200";
						}
					},
				}),
			delayMs: () =>
				p.text({
					message: "Delay between batches (ms)",
					placeholder: "100",
					defaultValue: "100",
					validate: (value) => {
						const num = Number.parseInt(value, 10);
						if (Number.isNaN(num) || num < 0) {
							return "Please enter a non-negative number";
						}
					},
				}),
			outputDir: () =>
				p.text({
					message: "Output directory",
					placeholder: "output",
					defaultValue: "output",
				}),
		},
		{
			onCancel: () => {
				p.cancel("Operation cancelled");
				process.exit(0);
			},
		},
	);

	return {
		concurrency: Number.parseInt(advancedGroup.concurrency, 10),
		maxCommentDepth: Number.parseInt(advancedGroup.maxCommentDepth, 10),
		delayMs: Number.parseInt(advancedGroup.delayMs, 10),
		outputDir: advancedGroup.outputDir,
	};
}

/**
 * Build complete CLI options from user selections
 */
export function buildOptions(
	features: (keyof ScraperOptions)[],
	advanced: {
		concurrency: number;
		maxCommentDepth: number;
		delayMs: number;
		outputDir: string;
	},
): CliOptions {
	const options: CliOptions = {
		fetchPosts: features.includes("fetchPosts"),
		fetchComments: features.includes("fetchComments"),
		fetchUsers: features.includes("fetchUsers"),
		fetchProfiles: features.includes("fetchProfiles"),
		fetchContributions: features.includes("fetchContributions"),
		fetchGamification: features.includes("fetchGamification"),
		fetchCommunityInfo: features.includes("fetchCommunityInfo"),
		fetchChannels: features.includes("fetchChannels"),
		fetchNotifications: features.includes("fetchNotifications"),
		concurrency: advanced.concurrency,
		maxCommentDepth: advanced.maxCommentDepth,
		delayMs: advanced.delayMs,
		outputDir: advanced.outputDir,
	};

	return options;
}

/**
 * Display selected options summary
 */
export function showOptionsSummary(options: CliOptions): void {
	const enabledFeatures = scraperFeatures
		.filter((f) => options[f.id])
		.map((f) => `${f.icon} ${f.label}`)
		.join(", ");

	p.note(
		`${pc.bold("Features:")} ${enabledFeatures}
${pc.bold("Concurrency:")} ${options.concurrency}
${pc.bold("Max Comment Depth:")} ${options.maxCommentDepth}
${pc.bold("Delay:")} ${options.delayMs}ms
${pc.bold("Output:")} ./${options.outputDir}/`,
		"Configuration",
	);
}

/**
 * Final confirmation before starting
 */
export async function confirmStart(): Promise<boolean> {
	const confirm = await p.confirm({
		message: "Start scraping with these settings?",
		initialValue: true,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Operation cancelled");
		return false;
	}

	return true;
}

/**
 * Display outro message
 */
export function showOutro(success: boolean, outputDir: string): void {
	if (success) {
		p.outro(pc.green(`🎉 Data exported to ${pc.bold(`./${outputDir}/`)}`));
	} else {
		p.outro(pc.red("❌ Scraping failed. Check the errors above."));
	}
}
