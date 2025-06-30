'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DataRenderer = ({ data }: { data: any }) => {
    if (typeof data === 'boolean') {
        return <Badge variant={data ? 'default' : 'secondary'} className={data ? 'bg-green-600/20 text-green-700' : 'bg-red-600/10 text-red-700'}>{String(data)}</Badge>;
    }

    if (data === null || data === undefined) {
        return <span className="text-muted-foreground">N/A</span>;
    }

    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            if (data.length === 0) return <span className="text-muted-foreground">Empty</span>;
            return (
                 <ul className="list-disc list-inside space-y-1">
                    {data.map((item, index) => (
                        <li key={index}>
                            <DataRenderer data={item} />
                        </li>
                    ))}
                </ul>
            );
        }
        
        return (
            <div className="mt-2 w-full">
                <Table className="bg-background rounded-md">
                    <TableBody>
                        {Object.entries(data).map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell className="font-medium w-1/3 py-1.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</TableCell>
                                <TableCell className="py-1.5"><DataRenderer data={value} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return <span className="break-all">{String(data)}</span>;
};

export const FingerprintDetail = ({ data }: { data: any }) => {
    if (!data) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No detailed fingerprint data available for this entry.
            </div>
        );
    }

    const sections = [
        { title: 'Hardware & Performance', key: 'hardware', data: data.hardware },
        { title: 'Software & Browser', key: 'software', data: data.software },
        { title: 'Network & Location', key: 'network', data: data.network },
        { title: 'Display & Media', key: 'display', data: data.display },
    ].filter(section => section.data);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 bg-muted/30">
            {sections.map(section => (
                <Card key={section.title} className="flex flex-col @container">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm">
                         <Table>
                            <TableBody>
                                {Object.entries(section.data).map(([key, value]) => (
                                    <TableRow key={key}>
                                        <TableCell className="font-medium w-1/3 capitalize align-top py-2">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <DataRenderer data={value} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
