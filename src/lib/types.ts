export interface LinkData {
  id: string;
  shortId: string;
  longUrl: string;
  anonymousToken: string;
  creatorFingerprint: string; // The hash
  creatorFingerprintData?: any; // The full data object
  createdAt: number;
}

export interface Visit {
  id: string;
  shortId: string;
  visitorFingerprint: string; // The hash
  visitedAt: number;
  visitorData?: any; // The full data object

  // Extracted data for analytics - Keep for existing charts
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
