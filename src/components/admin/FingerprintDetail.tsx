'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className={cn("w-full mt-1 space-y-1", level > 0 && "pl-2 border-l")}>
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row hover:bg-muted/30 rounded-md py-1 px-2 -mx-2">
                        <div className="font-medium capitalize align-top text-muted-foreground sm:w-1/3 shrink-0">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="sm:w-2/3 sm:pl-2"><DataRenderer data={value} level={level + 1} /></div>
                    </div>
                ))}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 p-2 bg-muted/20">
            {sections.map(section => (
                 <Card key={section.title} className="flex flex-col bg-card/50 shadow-sm">
                    <CardHeader className="py-2 px-3 border-b">
                        <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-xs p-0">
                        <div className="divide-y divide-border">
                            {Object.entries(section.data).map(([key, value]) => (
                                <div key={key} className="flex flex-col md:flex-row md:items-start p-2 hover:bg-muted/30">
                                    <div className="font-medium w-full md:w-1/3 capitalize align-top shrink-0 text-foreground/80">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div className="w-full md:w-2/3 mt-1 md:mt-0">
                                        <DataRenderer data={value} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
