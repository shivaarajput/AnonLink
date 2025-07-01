
export interface LinkData {
  id: string;
  shortId: string;
  longUrl: string;
  anonymousToken: string;
  createdAt: number;
  clicks: number;
  expiresAt?: number;
}

export interface Visit {
  id: string;
  shortId: string;
  visitorFingerprint: string;
  visitedAt: number;
  visitorData?: any;
}

export interface LinkWithAnalytics extends LinkData {
  visits?: Visit[];
}
