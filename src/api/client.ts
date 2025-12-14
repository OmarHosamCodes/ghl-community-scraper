import axios, { type AxiosInstance } from "axios";
import { env } from "../config/env";
import { buildHeaders } from "./headers";

const BASE_URL = "https://services.leadconnectorhq.com";

/**
 * Create an axios client configured for GHL API
 */
export function createApiClient(): AxiosInstance {
	return axios.create({
		baseURL: BASE_URL,
		headers: buildHeaders(),
	});
}

/**
 * Get the posts endpoint URL for a community/group
 */
export function getPostsEndpoint(
	communityId: string = env.communityId,
	groupId: string = env.groupId,
): string {
	return `/communities/${communityId}/groups/${groupId}/public/posts`;
}

/**
 * Get the comments endpoint URL for a specific post
 */
export function getCommentsEndpoint(
	communityId: string = env.communityId,
	groupId: string = env.groupId,
	postId: string,
): string {
	return `/communities/${communityId}/groups/${groupId}/public/posts/${postId}/comments`;
}

/**
 * Get the members endpoint URL for a community/group
 */
export function getMembersEndpoint(
	communityId: string = env.communityId,
	groupId: string = env.groupId,
): string {
	return `/communities/${communityId}/groups/${groupId}/public/members`;
}

/**
 * Get the leaderboard endpoint URL for a community/group
 */
export function getLeaderboardEndpoint(
	communityId: string = env.communityId,
	groupId: string = env.groupId,
): string {
	return `/communities/${communityId}/groups/${groupId}/public/leaderboard`;
}

/**
 * Get the community info endpoint URL
 */
export function getCommunityEndpoint(
	communityId: string = env.communityId,
): string {
	return `/communities/${communityId}/public`;
}

/**
 * Get the groups endpoint URL
 */
export function getGroupsEndpoint(
	communityId: string = env.communityId,
): string {
	return `/communities/${communityId}/public/groups`;
}

/**
 * Get the channels endpoint URL for a group
 */
export function getChannelsEndpoint(
	communityId: string = env.communityId,
	groupId: string = env.groupId,
): string {
	return `/communities/${communityId}/groups/${groupId}/public/channels`;
}

/**
 * Get the badges endpoint URL
 */
export function getBadgesEndpoint(
	communityId: string = env.communityId,
): string {
	return `/communities/${communityId}/public/badges`;
}

/**
 * Get the levels endpoint URL
 */
export function getLevelsEndpoint(
	communityId: string = env.communityId,
): string {
	return `/communities/${communityId}/public/levels`;
}

/**
 * Get the user profile endpoint URL
 */
export function getUserProfileEndpoint(
	communityId: string = env.communityId,
	userSlug: string,
): string {
	return `/communities/${communityId}/public/members/${userSlug}`;
}
