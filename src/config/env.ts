/**
 * Environment configuration
 * Loads and validates environment variables
 */
import { z } from "zod";

/**
 * Environment configuration
 * Loads and validates environment variables using Zod
 */

const rawEnvSchema = z.object({
	COMMUNITY_ID: z.string().min(1, "COMMUNITY_ID is required"),
	GROUP_ID: z.string().min(1, "GROUP_ID is required"),
	GROUP_SLUG: z.string().min(1, "GROUP_SLUG is required"),
	TOKEN_ID: z.string().min(1, "TOKEN_ID is required"),
	FETCH_LIMIT: z.preprocess(
		(val) => (val === undefined ? undefined : Number.parseInt(String(val), 10)),
		z.number().int().positive().default(20),
	),
	FETCH_DELAY_MS: z.preprocess(
		(val) => (val === undefined ? undefined : Number.parseInt(String(val), 10)),
		z.number().int().nonnegative().default(500),
	),
});

const parsed = rawEnvSchema.parse(process.env);

export const env = {
	// Community settings
	communityId: parsed.COMMUNITY_ID,
	groupId: parsed.GROUP_ID,
	groupSlug: parsed.GROUP_SLUG,

	// Authentication
	tokenId: parsed.TOKEN_ID,

	// API settings
	fetchLimit: parsed.FETCH_LIMIT,
	fetchDelayMs: parsed.FETCH_DELAY_MS,
} as const;

export type Env = typeof env;
