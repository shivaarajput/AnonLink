
'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { LinkData, Visit } from '@/lib/types';
import { getLinkAnalytics } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, Globe, User } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FingerprintDetail } from './FingerprintDetail';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function AnalyticsModal({ shortId }: { shortId: string }) {
    const [analytics, setAnalytics] = useState<{ link: LinkData | null, visits: Visit[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyticsCache, setAnalyticsCache] = useState<Record<string, { link: LinkData | null, visits: Visit[] }>>({});

    const fetchAnalytics = async () => {
        if (analyticsCache[shortId]) {
            setAnalytics(analyticsCache[shortId]);
            return;
        }
        setLoading(true);
        try {
            const data = await getLinkAnalytics(shortId);
            setAnalytics(data);
            setAnalyticsCache(prev => ({ ...prev, [shortId]: data }));
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const getVisitorPrimaryInfo = (visit: Visit) => {
        const data = visit.visitorData;
        if (!data) return { ip: 'N/A', country: 'N/A', os: 'N/A', region: 'N/A', battery: 'N/A' };
        
        const ip = data.network?.public?.ip || data.network?.local || 'N/A';
        const country = data.network?.public?.country || 'Unknown';
        const os = data.software?.os || 'Unknown';
        const region = data.network?.public?.region || 'N/A';

        let batteryInfo: string = 'N/A';
        if (data.hardware?.battery && typeof data.hardware.battery === 'object') {
            const battery = data.hardware.battery;
            const level = Math.round(battery.level * 100);
            const status = battery.charging ? 'Charging' : 'Discharging';
            batteryInfo = `${level}% (${status})`;
        } else if (typeof data.hardware?.battery === 'string') {
            batteryInfo = data.hardware.battery;
        }

        return { ip, country, os, region, battery: batteryInfo };
    }

    return (
        <Dialog onOpenChange={(open) => { if (open) fetchAnalytics(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" aria-label={`View analytics for /${shortId}`}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-full p-2 sm:p-4">
                <DialogHeader className="px-2">
                    <DialogTitle>Analytics for /{shortId}</DialogTitle>
                    <DialogDescription>Detailed creator and visitor information for this link.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-2 -mr-2">
                    {loading ? (
                         <div className="space-y-4 p-1">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <div className="border rounded-md mt-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    ) : analytics && analytics.link ? (
                        <Accordion type="single" collapsible defaultValue="visitors" className="w-full">
                            {analytics.link.anonymousToken && (
                                <AccordionItem value="creator">
                                    <AccordionTrigger className="text-lg font-semibold">
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5" /> Creator Details
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="mb-4 space-y-2 text-sm px-2">
                                            <div><strong>Original URL:</strong> <a href={analytics.link.longUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{analytics.link.longUrl}</a></div>
                                            <div><strong>Creator Token:</strong> <code className="text-xs bg-muted p-1 rounded break-all">{analytics.link.anonymousToken}</code></div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            <AccordionItem value="visitors">
                                <AccordionTrigger className="text-lg font-semibold">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" /> Visitor Details ({analytics.visits.length} clicks)
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="rounded-md border">
                                        <Table className="w-full table-fixed">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="p-2 w-[35%] sm:w-[30%] md:w-[25%] lg:w-[20%]">
                                                        <span className="lg:hidden">Datetime</span>
                                                        <span className="hidden lg:inline whitespace-nowrap">Visited At</span>
                                                    </TableHead>
                                                    <TableHead className="p-2 hidden sm:table-cell sm:w-[25%] md:w-[20%] lg:w-[15%]">Country</TableHead>
                                                    <TableHead className="p-2 hidden md:table-cell md:w-[20%] lg:w-[15%]">Region</TableHead>
                                                    <TableHead className="p-2 hidden lg:table-cell lg:w-[10%]">Battery</TableHead>
                                                    <TableHead className="p-2 w-[30%] sm:w-[20%] md:w-[15%] lg:w-[15%]">OS</TableHead>
                                                    <TableHead className="p-2 w-[35%] sm:w-[25%] md:w-[20%] lg:w-[25%]">IP Address</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            {analytics.visits.length > 0 ? analytics.visits.map(visit => (
                                                <Collapsible asChild key={visit.id}>
                                                    <TableBody>
                                                        <TableRow className="cursor-pointer group hover:bg-muted/50 data-[state=open]:bg-muted/50" data-state="closed">
                                                            <CollapsibleTrigger asChild>
                                                                <TableCell colSpan={6} className="p-0">
                                                                    <div className="flex w-full items-start">
                                                                        <div className="p-2 text-xs align-top w-[35%] sm:w-[30%] md:w-[25%] lg:w-[20%]">
                                                                            <span className="hidden lg:inline whitespace-nowrap">{format(new Date(visit.visitedAt), 'MMM d, yyyy, p')}</span>
                                                                            <div className="lg:hidden">
                                                                                <div>{format(new Date(visit.visitedAt), 'MMM d, yyyy')}</div>
                                                                                <div className="text-muted-foreground">{format(new Date(visit.visitedAt), 'p')}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="hidden sm:block p-2 text-xs align-top w-[25%] md:w-[20%] lg:w-[15%]">{getVisitorPrimaryInfo(visit).country}</div>
                                                                        <div className="hidden md:block p-2 text-xs align-top w-[20%] lg:w-[15%]">{getVisitorPrimaryInfo(visit).region}</div>
                                                                        <div className="hidden lg:block p-2 text-xs align-top w-[10%]">{getVisitorPrimaryInfo(visit).battery}</div>
                                                                        <div className="p-2 text-xs align-top truncate w-[30%] sm:w-[20%] md:w-[15%] lg:w-[15%]">{getVisitorPrimaryInfo(visit).os}</div>
                                                                        <div className="p-2 text-xs align-top w-[35%] sm:w-[25%] md:w-[20%] lg:w-[25%]">
                                                                            <code className="block break-all">{getVisitorPrimaryInfo(visit).ip}</code>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </CollapsibleTrigger>
                                                        </TableRow>
                                                        <CollapsibleContent asChild>
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="p-0">
                                                                    <FingerprintDetail data={visit.visitorData} />
                                                                </TableCell>
                                                            </TableRow>
                                                        </CollapsibleContent>
                                                    </TableBody>
                                                </Collapsible>
                                            )) : (
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center h-24">No visits recorded yet.</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            )}
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ) : <p className="text-center py-8">No data found.</p>
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}
