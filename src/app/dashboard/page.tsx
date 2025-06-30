
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getLinksByToken } from '@/lib/actions';
import { getAnonymousToken } from '@/lib/store';
import { LinkWithAnalytics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clipboard, Check, ExternalLink, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      const token = getAnonymousToken();
      if (token) {
        const userLinks = await getLinksByToken(token);
        setLinks(userLinks);
      }
      setLoading(false);
    };

    fetchLinks();
  }, []);

  const handleCopy = (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation(); // Prevent collapsible from triggering
    const url = `${window.location.origin}/${shortId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(shortId);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedLink(null), 2000);
  };
  
  const origin = useMemo(() => typeof window !== 'undefined' ? window.location.origin : '', []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Links</CardTitle>
        <CardDescription>Here are the links you've created. Click a link to see visitor analytics.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short Link</TableHead>
                <TableHead className="hidden md:table-cell">Original URL</TableHead>
                <TableHead className="text-center">Clicks</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : links.length > 0 ? (
                links.map(link => (
                  <Collapsible asChild key={link.id} className="group even:bg-muted/20">
                    <>
                      <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer">
                              <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                      <a href={`/${link.shortId}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5">
                                          {`${origin.replace(/https?:\/\//, '')}/${link.shortId}`}
                                          <ExternalLink className="h-3 w-3" />
                                      </a>
                                  </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell truncate max-w-sm">
                                  {link.longUrl}
                              </TableCell>
                              <TableCell className="text-center font-semibold">{link.clicks}</TableCell>
                              <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{format(new Date(link.createdAt), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => handleCopy(e, link.shortId)} aria-label="Copy link">
                                  {copiedLink === link.shortId ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                          </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                          <TableRow className="bg-muted/50">
                              <TableCell colSpan={5} className="p-0">
                                  <AnalyticsCharts visits={link.visits ?? []} />
                              </TableCell>
                          </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    You haven't created any links yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
