import { Platform } from "@marklabs/database";

export interface PublishResult {
  success: boolean;
  providerPostId?: string;
  error?: string;
  rateLimited?: boolean;
}

export type PostType = "POST" | "REEL" | "STORY" | "CAROUSEL";
export type MediaType = "IMAGE" | "VIDEO";

export interface PublishMedia {
  url: string;
  type: MediaType;
  order?: number;
}

export interface PublishInput {
  content: string;
  postType?: PostType;
  media?: PublishMedia[];
}

export interface AnalyticsSnapshot {
  followers: number;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface SocialProvider {
  platform: Platform;

  /**
   * Initializes the OAuth connection flow and returns the authorization URL.
   */
  getAuthUrl(redirectUri: string, state: string): string;

  /**
   * Exchanges an authorization code for an access token (and refresh token).
   */
  exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; tokenExpiry?: Date; platformId: string; name: string; username?: string; avatar?: string; }>;

  /**
   * Publishes content to the social network.
   */
  publish(accessToken: string, platformId: string, input: PublishInput): Promise<PublishResult>;

  /**
   * Fetches the latest analytics for the social account.
   */
  getAnalytics(accessToken: string, platformId: string): Promise<AnalyticsSnapshot>;
  
  /**
   * Checks if the OAuth token is still valid.
   */
  verifyHealth(accessToken: string): Promise<boolean>;
}

export * from "./facebook";
export * from "./linkedin";
export * from "./instagram";
