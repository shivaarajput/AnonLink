'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { LinkData, Visit } from '@/lib/types';
import { getLinkAnalyticsAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2 } from 'lucide-react';

export function AnalyticsModal({ shortId }: { shortId: string }) {
    const [analytics, setAnalytics] = useState<{ link: LinkData | null, visits: Visit[] } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await getLinkAnalyticsAdmin(shortId);
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog onOpenChange={(open) => { if (open && !analytics) fetchAnalytics(); }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`View analytics for /${shortId}`}>
                    <BarChart2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Analytics for /{shortId}</DialogTitle>
                    <DialogDescription>Detailed creator and visitor information for this link.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-6">
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-8 w-1/3 mt-4" />
                            <div className="border rounded-md">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    ) : analytics && analytics.link ? (
                        <div className="space-y-4">
                             <div>
                                <strong>Original URL:</strong> <a href={analytics.link.longUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{analytics.link.longUrl}</a>
                            </div>
                            <div>
                                <strong>Creator Fingerprint:</strong> <code className="text-xs bg-muted p-1 rounded break-all">{analytics.link.creatorFingerprint}</code>
                            </div>
                            <h3 className="font-bold mt-4 mb-2 text-lg">Visitor Details ({analytics.visits.length} clicks)</h3>
                            <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Visited At</TableHead>
                                        <TableHead>Visitor Fingerprint</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.visits.length > 0 ? analytics.visits.map(visit => (
                                        <TableRow key={visit.id}>
                                            <TableCell>{format(new Date(visit.visitedAt), 'MMM d, yyyy, h:mm:ss a')}</TableCell>
                                            <TableCell><code className="text-xs break-all">{visit.visitorFingerprint}</code></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">No visits recorded yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    ) : <p>No data found.</p>
                    }
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
