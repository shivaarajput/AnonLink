export interface LinkData {
  id: string;
  shortId: string;
  longUrl: string;
  anonymousToken: string;
  creatorFingerprint: string;
  createdAt: number;
}

export interface Visit {
  id: string;
  shortId: string;
  visitorFingerprint: string;
  visitedAt: number;
  // Extracted data for analytics
  browser?: string;
  os?: string;
  country?: string;
  isp?: string;
  gpuRenderer?: string;
}

export interface LinkWithAnalytics extends LinkData {
  clicks: number;
  visits: Visit[];
}
