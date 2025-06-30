'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DataRenderer = ({ data, level = 0 }: { data: any, level?: number }) => {
    if (data === null || data === undefined || data === '') {
        return <span className="text-muted-foreground/80">N/A</span>;
    }

    if (typeof data === 'boolean') {
        return <Badge variant={data ? 'default' : 'destructive'} className={cn(data ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200', 'border-none')}>{String(data)}</Badge>;
    }
    
    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            if (data.length === 0) return <span className="text-muted-foreground/80">Empty</span>;
            
            const isSimpleArray = data.every(item => typeof item !== 'object' || item === null);

            if (isSimpleArray) {
                return <div className="flex flex-wrap gap-1">{data.map((item, index) => <Badge variant="secondary" key={index}>{String(item)}</Badge>)}</div>
            }
            
            return (
                 <div className="flex flex-col gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="rounded-md border bg-muted/30 p-2">
                            <DataRenderer data={item} level={level + 1} />
                        </div>
                    ))}
                </div>
            );
        }
        
        const isSimpleObject = Object.values(data).every(v => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every(item => typeof item !== 'object')));

        if (isSimpleObject) {
             return (
                <div className="space-y-1">
                    {Object.entries(data).map(([key, value]) => {
                        const finalValue = (key === 'level' && typeof value === 'number' && value <= 1)
                            ? `${(value * 100).toFixed(0)}%`
                            : value;

                        return (
                             <div key={key}>
                                <span className="font-medium capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                                <DataRenderer data={finalValue} level={level + 1} /> 
                            </div>
                        )
                    })}
                </div>
            );
        }

        return (
            <div className={cn("w-full mt-1", level > 0 && "pl-4 border-l")}>
                <Table className="bg-transparent text-xs">
                    <TableBody>
                        {Object.entries(data).map(([key, value]) => (
                            <TableRow key={key} className="hover:bg-muted/30">
                                <TableCell className="font-medium py-1 px-2 capitalize align-top">{key.replace(/([A-Z])/g, ' $1')}</TableCell>
                                <TableCell className="py-1 px-2"><DataRenderer data={value} level={level + 1} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return <span className="break-words">{String(data)}</span>;
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
    ].filter(section => section.data && Object.keys(section.data).length > 0);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 bg-muted/20">
            {sections.map(section => (
                 <Card key={section.title} className="flex flex-col bg-card/50 shadow-sm">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-xs p-0">
                         <Table>
                            <TableBody>
                                {Object.entries(section.data).map(([key, value]) => (
                                    <TableRow key={key} className="hover:bg-muted/30">
                                        <TableCell className="font-medium w-2/5 md:w-1/3 capitalize align-top py-2 px-4">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
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
