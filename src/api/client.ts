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
