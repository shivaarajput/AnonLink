
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
        <div className="p-2 bg-muted/30">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-2 px-2">
                <Globe className="h-5 w-5 text-primary" /> Visitor Details ({visits.length} clicks)
            </h3>
            <div className="rounded-md border bg-card">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-2 w-[25%] lg:w-[20%]">Datetime</TableHead>
                            <TableHead className="px-2 w-[40%] lg:w-[25%]">IP Address</TableHead>
                            <TableHead className="hidden lg:table-cell px-2 lg:w-[12%]">Country</TableHead>
                            <TableHead className="hidden lg:table-cell px-2 lg:w-[13%]">Region</TableHead>
                            <TableHead className="px-2 w-[35%] lg:w-[15%]">OS</TableHead>
                            <TableHead className="hidden lg:table-cell px-2 lg:w-[15%]">Battery</TableHead>
                        </TableRow>
                    </TableHeader>
                    {visits.length > 0 ? (
                        visits.map(visit => (
                            <Collapsible asChild key={visit.id}>
                                <TableBody>
                                    <CollapsibleTrigger asChild>
                                        <TableRow className="cursor-pointer group hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                            <TableCell className="p-2 align-top text-xs">
                                                <div className="lg:hidden">
                                                    <div>{format(new Date(visit.visitedAt), 'MMM d, yyyy')}</div>
                                                    <div className="text-muted-foreground">{format(new Date(visit.visitedAt), 'p')}</div>
                                                </div>
                                                <div className="hidden lg:block truncate">
                                                    {format(new Date(visit.visitedAt), 'MMM d, yyyy, p')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2 text-xs"><code className="block break-all">{getVisitorPrimaryInfo(visit).ip}</code></TableCell>
                                            <TableCell className="hidden lg:table-cell p-2 text-xs">{getVisitorPrimaryInfo(visit).country}</TableCell>
                                            <TableCell className="hidden lg:table-cell p-2 text-xs">{getVisitorPrimaryInfo(visit).region}</TableCell>
                                            <TableCell className="p-2 text-xs truncate">
                                                {getVisitorPrimaryInfo(visit).os}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell p-2 text-xs">{getVisitorPrimaryInfo(visit).battery}</TableCell>
                                        </TableRow>
                                    </CollapsibleTrigger>
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
