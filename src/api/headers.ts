import { env } from "../config/env";

/**
 * Build request headers for GHL API
 */
export function buildHeaders(): Record<string, string> {
	return {
		"User-Agent":
			"Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0",
		Accept: "application/json, text/plain, */*",
		"Accept-Language": "en-US,ar-EG;q=0.7,en;q=0.3",
		channel: "APP",
		source: "PORTAL_USER",
		version: "2023-02-21",
		"x-app-version": "web",
		"x-app-build": "communities-2025.12.08-08:57Z",
		"x-cp-core-version": "3.2.39",
		"x-platform-details": "web",
		"x-location-id": env.communityId,
		"token-id": env.tokenId,
		"Sec-GPC": "1",
		"Sec-Fetch-Dest": "empty",
		"Sec-Fetch-Mode": "cors",
		"Sec-Fetch-Site": "cross-site",
	};
}
