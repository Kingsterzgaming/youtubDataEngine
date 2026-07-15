export interface ChannelProfile {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  brandingSettings?: {
    channel?: {
      title: string;
      description?: string;
      keywords?: string;
    };
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
    standard?: { url: string };
    maxres?: { url: string };
  };
  tags: string[];
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  videoCount: number;
}

export interface CommentItem {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
}

export interface SearchResult {
  id: string;
  type: "video" | "channel" | "playlist" | "unknown";
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}

export interface AiAuditReport {
  channelAudit: string;
  nicheAnalysis: string;
  contentStrategy: string;
  tacticalRecommendations: string[];
}

export interface AiTitleOption {
  title: string;
  reasoning: string;
  style: string;
}

export interface AiGrowthPrediction {
  projections: Array<{
    month: string;
    conservative: number;
    moderate: number;
    aggressive: number;
  }>;
  milestones: Array<{
    name: string;
    timeframe: string;
    requirements: string;
  }>;
  growthStrategy: string;
}

export interface AiKeywordAnalysis {
  keywords: Array<{
    keyword: string;
    intent: string;
    relevanceScore: number;
  }>;
  seoChecklist: string[];
}
