
'use client';

import { format } from 'date-fns';
import { LinkData, Visit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FingerprintDetail } from '@/components/admin/FingerprintDetail';
import { Globe, ChevronDown } from 'lucide-react';

interface DetailedAnalyticsProps {
    link: LinkData;
    visits: Visit[];
}

export function DetailedAnalytics({ link, visits }: DetailedAnalyticsProps) {

    const getVisitorPrimaryInfo = (visit: Visit) => {
        const data = visit.visitorData;
        if (!data) return { ip: 'N/A', country: 'N/A', browser: 'N/A', os: 'N/A' };
        
        const ip = data.network?.public?.ip || data.network?.local || 'N/A';
        const country = data.network?.public?.country || 'Unknown';
        const browser = data.software?.browser || 'Unknown';
        const os = data.software?.os || 'Unknown';

        return { ip, country, browser, os };
    }

    return (
        <div className="p-2 bg-muted/30">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-2 px-2">
                <Globe className="h-5 w-5 text-primary" /> Visitor Details ({visits.length} clicks)
            </h3>
            <div className="rounded-md border bg-card">
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
                    {visits.length > 0 ? (
                        visits.map(visit => (
                            <Collapsible asChild key={visit.id}>
                                <TableBody>
                                    <CollapsibleTrigger asChild>
                                        <TableRow className="cursor-pointer group hover:bg-muted/50 data-[state=open]:bg-muted/50">
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
                        ))
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No visits recorded yet.</TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </div>
        </div>
    );
}
