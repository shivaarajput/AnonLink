'use client';

import { Visit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface AnalyticsChartsProps {
  visits: Visit[];
}

const processData = (visits: Visit[], key: keyof Visit) => {
    const counts = visits.reduce((acc, visit) => {
        let value = (visit[key] as string) || 'Unknown';
        if (key === 'gpuRenderer' && value.length > 35) {
            value = value.substring(0, 35) + '...';
        }
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7); // Get top 7 for cleaner charts
};

export function AnalyticsCharts({ visits }: AnalyticsChartsProps) {
    const browserData = useMemo(() => processData(visits, 'browser'), [visits]);
    const osData = useMemo(() => processData(visits, 'os'), [visits]);
    const countryData = useMemo(() => processData(visits, 'country'), [visits]);

    if (visits.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No visitor data to display yet.</div>;
    }

    const renderBarChart = (data: {name: string, value: number}[], title: string) => {
        if (!data || data.length === 0) return null;
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={100} 
                                tick={{ fontSize: 12 }}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip 
                                cursor={{fill: 'hsl(var(--muted))'}} 
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Bar dataKey="value" fill="hsl(var(--primary))" barSize={20} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="bg-muted/50 p-4">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {renderBarChart(browserData, "Top Browsers")}
                {renderBarChart(osData, "Top Operating Systems")}
                {renderBarChart(countryData, "Top Countries")}
             </div>
        </div>
    );
}
