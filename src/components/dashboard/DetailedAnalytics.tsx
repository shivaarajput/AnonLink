
'use client';

import { format } from 'date-fns';
import { LinkData, Visit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FingerprintDetail } from '@/components/admin/FingerprintDetail';
import { Globe } from 'lucide-react';

interface DetailedAnalyticsProps {
    link: LinkData;
    visits: Visit[];
}

export function DetailedAnalytics({ link, visits }: DetailedAnalyticsProps) {

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
        <div className="p-2 sm:p-4 bg-muted/30">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-2 px-2">
                <Globe className="h-5 w-5 text-primary" /> Visitor Details ({visits.length} clicks)
            </h3>
            <div className="rounded-md border bg-card">
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
                    {visits.length > 0 ? (
                        visits.map(visit => (
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
                        ))
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No visits recorded yet.</TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </div>
        </div>
    );
}
