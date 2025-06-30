
'use client';

import { useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/auth';
import { getLinkAnalytics } from '@/lib/actions';
import { getAnonymousToken } from '@/lib/store';
import { LinkData, Visit } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clipboard, Check, ExternalLink, ChevronDown, ChevronUp, LogOut, Loader2, User as UserIcon, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DetailedAnalytics } from '@/components/dashboard/DetailedAnalytics';

type AnalyticsCache = Record<string, { link: LinkData; visits: Visit[] }>;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [links, setLinks] = useState<LinkData[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  
  // States for expanding links and caching analytics
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [analyticsCache, setAnalyticsCache] = useState<AnalyticsCache>({});
  const [loadingAnalyticsId, setLoadingAnalyticsId] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const origin = useMemo(() => typeof window !== 'undefined' ? window.location.origin : '', []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        const adminStatus = await checkIsAdmin(currentUser);
        setUser(currentUser);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    setLinksLoading(true);

    let linksQuery;
    if (isAdmin) {
      linksQuery = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    } else {
      const token = getAnonymousToken();
      if (token) {
        linksQuery = query(collection(db, 'links'), where('anonymousToken', '==', token));
      } else {
        setLinks([]);
        setLinksLoading(false);
        return;
      }
    }

    const unsubscribe = onSnapshot(linksQuery, (querySnapshot) => {
      const linksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));
      
      if (!isAdmin) {
          linksData.sort((a, b) => b.createdAt - a.createdAt);
      }
      
      setLinks(linksData);
      setLinksLoading(false);
    }, (error) => {
        console.error("Error fetching real-time links:", error);
        toast({
            title: "Error Fetching Links",
            description: "Could not retrieve link data in real-time.",
            variant: "destructive"
        });
        setLinksLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, authLoading, toast]);

  const handleToggleExpand = async (isOpen: boolean, link: LinkData) => {
    const { id: docId, clicks } = link;
  
    if (!isOpen) {
      setExpandedLinkId(null);
      return;
    }
  
    setExpandedLinkId(docId);
  
    // Check if the data is already in cache AND if it's stale
    const isStale = analyticsCache[docId] && analyticsCache[docId].link.clicks !== clicks;
  
    if (analyticsCache[docId] && !isStale) {
      return; // Use cached data
    }
  
    setLoadingAnalyticsId(docId);
  
    try {
      let analyticsData;
      if (isAdmin) {
        analyticsData = await getLinkAnalytics(link.shortId);
      } else {
        const token = getAnonymousToken();
        analyticsData = await getLinkAnalytics(link.shortId, token);
      }
  
      if (analyticsData.link) {
        setAnalyticsCache(prevCache => ({
          ...prevCache,
          [docId]: analyticsData,
        }));
      } else {
        toast({ title: 'Error', description: 'Could not fetch link details.', variant: 'destructive' });
        setExpandedLinkId(null);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({ title: 'Error', description: 'Could not fetch analytics data.', variant: 'destructive' });
      setExpandedLinkId(null);
    } finally {
      setLoadingAnalyticsId(null);
    }
  };


  const handleCopy = (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    const url = `${origin}/${shortId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(shortId);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedLink(null), 2000);
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const pageTitle = isAdmin ? "Admin Dashboard" : "My Links";
  const pageDescription = isAdmin ? "View and manage all shortened links across the platform." : "Here are the links you've created. Click a link to see visitor analytics.";

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {isAdmin ? <Shield /> : <UserIcon />}
            {pageTitle}
          </CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </div>
        {isAdmin && user && (
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Short Link</TableHead>
                <TableHead className="hidden lg:table-cell w-[300px]">Original URL</TableHead>
                <TableHead className="text-center w-[70px]">Clicks</TableHead>
                {isAdmin && <TableHead className="hidden md:table-cell w-[150px]">Creator Token</TableHead>}
                <TableHead className="hidden sm:table-cell text-center w-[120px]">Created</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            {linksLoading ? (
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 7 : 6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : links.length > 0 ? (
              links.map(link => (
                <Collapsible asChild key={link.id} open={expandedLinkId === link.id} onOpenChange={(isOpen) => handleToggleExpand(isOpen, link)}>
                  <TableBody>
                     <TableRow className="data-[state=open]:bg-muted/50" data-state={expandedLinkId === link.id ? 'open' : 'closed'}>
                        <TableCell>
                           <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {expandedLinkId === link.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span className="sr-only">Toggle details</span>
                              </Button>
                           </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">
                            <a href={`/${link.shortId}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5 min-w-0">
                                <span className="truncate">
                                    {`${origin.replace(/https?:\/\//, '')}/${link.shortId}`}
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell truncate">{link.longUrl}</TableCell>
                        <TableCell className="text-center font-semibold">{link.clicks}</TableCell>
                        {isAdmin && <TableCell className="hidden md:table-cell truncate"><code className="text-xs bg-muted p-1 rounded">{link.anonymousToken}</code></TableCell>}
                        <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{format(new Date(link.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => handleCopy(e, link.shortId)} aria-label="Copy link">
                            {copiedLink === link.shortId ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                        <TableRow className="bg-background">
                            <TableCell colSpan={isAdmin ? 7 : 6} className="p-0">
                                {loadingAnalyticsId === link.id && (
                                  <div className="flex items-center justify-center p-8 gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-muted-foreground">Loading Analytics...</span>
                                  </div>
                                )}
                                {analyticsCache[link.id] && expandedLinkId === link.id && (
                                  <DetailedAnalytics link={analyticsCache[link.id].link} visits={analyticsCache[link.id].visits} />
                                )}
                            </TableCell>
                        </TableRow>
                    </CollapsibleContent>
                  </TableBody>
                </Collapsible>
              ))
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center h-24 text-muted-foreground">
                    You haven't created any links yet.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
