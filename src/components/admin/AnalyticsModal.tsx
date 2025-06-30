
'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { LinkData, Visit } from '@/lib/types';
import { getLinkAnalyticsAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, ChevronDown, Globe, User } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FingerprintDetail } from './FingerprintDetail';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

    const getVisitorPrimaryInfo = (visit: Visit) => {
        const data = visit.visitorData;
        if (!data) return { ip: 'N/A', country: 'N/A', browser: 'N/A', os: 'N/A' };
        
        const ip = data.network?.public?.ip || 'N/A';
        const country = data.network?.public?.country || 'Unknown';
        const browser = data.software?.browser || 'Unknown';
        const os = data.software?.os || 'Unknown';

        return { ip, country, browser, os };
    }

    return (
        <Dialog onOpenChange={(open) => { if (open && !analytics) fetchAnalytics(); }}>
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
                            <AccordionItem value="creator">
                                <AccordionTrigger className="text-lg font-semibold">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5" /> Creator Details
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="mb-4 space-y-2 text-sm px-2">
                                        <div><strong>Original URL:</strong> <a href={analytics.link.longUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{analytics.link.longUrl}</a></div>
                                        <div><strong>Creator Fingerprint Hash:</strong> <code className="text-xs bg-muted p-1 rounded break-all">{analytics.link.creatorFingerprint}</code></div>
                                    </div>
                                    <FingerprintDetail data={analytics.link.creatorFingerprintData} />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="visitors">
                                <AccordionTrigger className="text-lg font-semibold">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" /> Visitor Details ({analytics.visits.length} clicks)
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="rounded-md border">
                                        <Table className="table-fixed w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[40px] px-2"></TableHead>
                                                    <TableHead className="px-2 w-[110px]">Visited At</TableHead>
                                                    <TableHead className="px-2 w-[120px] sm:w-[200px]">IP Address</TableHead>
                                                    <TableHead className="px-2 w-[100px]">Country</TableHead>
                                                    <TableHead className="px-2">Browser & OS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            {analytics.visits.length > 0 ? analytics.visits.map(visit => (
                                                <Collapsible asChild key={visit.id}>
                                                    <TableBody>
                                                        <CollapsibleTrigger asChild className="group">
                                                            <TableRow className="cursor-pointer">
                                                                <TableCell className="p-2 pl-4">
                                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                                </TableCell>
                                                                <TableCell className="p-2 align-top text-xs">
                                                                    <div>{format(new Date(visit.visitedAt), 'MMM d, yyyy')}</div>
                                                                    <div className="text-muted-foreground">{format(new Date(visit.visitedAt), 'h:mm a')}</div>
                                                                </TableCell>
                                                                <TableCell className="p-2"><code className="block break-all text-xs">{getVisitorPrimaryInfo(visit).ip}</code></TableCell>
                                                                <TableCell className="p-2 text-xs">{getVisitorPrimaryInfo(visit).country}</TableCell>
                                                                <TableCell className="p-2 text-xs truncate">
                                                                    {getVisitorPrimaryInfo(visit).browser} on {getVisitorPrimaryInfo(visit).os}
                                                                </TableCell>
                                                            </TableRow>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent asChild>
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="p-0">
                                                                    <FingerprintDetail data={visit.visitorData} />
                                                                </TableCell>
                                                            </TableRow>
                                                        </CollapsibleContent>
                                                    </TableBody>
                                                </Collapsible>
                                            )) : (
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center h-24">No visits recorded yet.</TableCell>
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
