/**
 * Environment configuration
 * Loads and validates environment variables
 */

function getEnvVar(key: string, defaultValue?: string): string {
	const value = process.env[key] ?? defaultValue;
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
	const value = process.env[key];
	if (!value) return defaultValue;
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) {
		throw new Error(`Environment variable ${key} must be a number`);
	}
	return parsed;
}

export const env = {
	// Community settings
	communityId: getEnvVar("COMMUNITY_ID"),
	groupId: getEnvVar("GROUP_ID"),

	// Authentication
	tokenId: getEnvVar("TOKEN_ID"),

	// API settings
	fetchLimit: getEnvNumber("FETCH_LIMIT", 20),
	fetchDelayMs: getEnvNumber("FETCH_DELAY_MS", 500),
} as const;

export type Env = typeof env;
