export interface LinkData {
  id: string;
  shortId: string;
  longUrl: string;
  anonymousToken: string;
  creatorFingerprint: string;
  createdAt: number;
}

export interface LinkWithAnalytics extends LinkData {
  clicks: number;
}

export interface Visit {
  id:string;
  shortId: string;
  visitorFingerprint: string;
  visitedAt: number;
}
