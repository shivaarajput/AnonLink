
export interface LinkData {
  id: string;
  shortId: string;
  longUrl: string;
  anonymousToken: string;
  creatorFingerprint: string;
  creatorFingerprintData?: any;
  createdAt: number;
}

export interface Visit {
  id: string;
  shortId: string;
  visitorFingerprint: string;
  visitedAt: number;
  visitorData?: any;
}

export interface LinkWithAnalytics extends LinkData {
  clicks: number;
  visits?: Visit[];
}
