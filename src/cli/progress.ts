/**
 * CLI Progress Bar Utilities
 * Multi-bar progress display for concurrent operations
 */
import cliProgress from "cli-progress";
import pc from "picocolors";

export type ProgressBarType =
	| "posts"
	| "comments"
	| "users"
	| "profiles"
	| "contributions"
	| "gamification"
	| "community"
	| "channels"
	| "notifications";

interface ProgressConfig {
	name: string;
	icon: string;
	color: (str: string) => string;
}

const progressConfigs: Record<ProgressBarType, ProgressConfig> = {
	posts: { name: "Posts", icon: "📝", color: pc.cyan },
	comments: { name: "Comments", icon: "💬", color: pc.yellow },
	users: { name: "Users", icon: "👥", color: pc.green },
	profiles: { name: "Profiles", icon: "👤", color: pc.magenta },
	contributions: { name: "Contributions", icon: "📊", color: pc.blue },
	gamification: { name: "Gamification", icon: "🏆", color: pc.yellow },
	community: { name: "Community", icon: "🏠", color: pc.cyan },
	channels: { name: "Channels", icon: "📺", color: pc.green },
	notifications: { name: "Notifications", icon: "🔔", color: pc.magenta },
};

/**
 * Create a styled progress bar format
 */
function createFormat(config: ProgressConfig): string {
	return `${config.icon} ${config.color(config.name.padEnd(14))} ${pc.dim("│")} {bar} ${pc.dim("│")} {percentage}% ${pc.dim("│")} {value}/{total} ${pc.dim("│")} ETA: {eta}s`;
}

/**
 * ProgressManager handles multiple progress bars for concurrent operations
 */
export class ProgressManager {
	private multiBar: cliProgress.MultiBar;
	private bars: Map<ProgressBarType, cliProgress.SingleBar>;

	constructor() {
		this.multiBar = new cliProgress.MultiBar(
			{
				clearOnComplete: false,
				hideCursor: true,
				format: `{icon} {name} ${pc.dim("│")} {bar} ${pc.dim("│")} {percentage}% ${pc.dim("│")} {value}/{total} ${pc.dim("│")} ETA: {eta}s`,
				barCompleteChar: "█",
				barIncompleteChar: "░",
				barsize: 25,
				stopOnComplete: true,
			},
			cliProgress.Presets.shades_grey,
		);
		this.bars = new Map();
	}

	/**
	 * Create a new progress bar
	 */
	createBar(type: ProgressBarType, total: number): cliProgress.SingleBar {
		const config = progressConfigs[type];
		const bar = this.multiBar.create(total, 0, {
			icon: config.icon,
			name: config.color(config.name.padEnd(14)),
		});
		this.bars.set(type, bar);
		return bar;
	}

	/**
	 * Update a progress bar
	 */
	update(type: ProgressBarType, value: number): void {
		const bar = this.bars.get(type);
		if (bar) {
			bar.update(value);
		}
	}

	/**
	 * Increment a progress bar
	 */
	increment(type: ProgressBarType, amount = 1): void {
		const bar = this.bars.get(type);
		if (bar) {
			bar.increment(amount);
		}
	}

	/**
	 * Complete a progress bar
	 */
	complete(type: ProgressBarType): void {
		const bar = this.bars.get(type);
		if (bar) {
			bar.stop();
		}
	}

	/**
	 * Stop all progress bars
	 */
	stop(): void {
		this.multiBar.stop();
	}

	/**
	 * Get the underlying MultiBar instance
	 */
	getMultiBar(): cliProgress.MultiBar {
		return this.multiBar;
	}
}

/**
 * Create a single progress bar for simple operations
 */
export function createSingleBar(
	type: ProgressBarType,
	total: number,
): cliProgress.SingleBar {
	const config = progressConfigs[type];
	const bar = new cliProgress.SingleBar(
		{
			format: createFormat(config),
			barCompleteChar: "█",
			barIncompleteChar: "░",
			barsize: 30,
			hideCursor: true,
			clearOnComplete: false,
		},
		cliProgress.Presets.shades_grey,
	);
	bar.start(total, 0);
	return bar;
}

/**
 * Create a spinner-style progress indicator for indeterminate operations
 */
export class Spinner {
	private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	private currentFrame = 0;
	private interval: ReturnType<typeof setInterval> | null = null;
	private message: string;

	constructor(message: string) {
		this.message = message;
	}

	start(): void {
		this.interval = setInterval(() => {
			process.stdout.write(
				`\r${pc.cyan(this.frames[this.currentFrame])} ${this.message}`,
			);
			this.currentFrame = (this.currentFrame + 1) % this.frames.length;
		}, 80);
	}

	stop(success = true): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		const icon = success ? pc.green("✓") : pc.red("✗");
		process.stdout.write(`\r${icon} ${this.message}\n`);
	}

	updateMessage(message: string): void {
		this.message = message;
	}
}
