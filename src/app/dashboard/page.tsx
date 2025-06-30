
'use client';

import { useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/auth';
import { getLinksByToken, getAllLinksAdmin, getLinkAnalytics } from '@/lib/actions';
import { getAnonymousToken } from '@/lib/store';
import { LinkData, Visit } from '@/lib/types';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clipboard, Check, ExternalLink, ChevronDown, LogOut, Loader2, User as UserIcon, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DetailedAnalytics } from '@/components/dashboard/DetailedAnalytics';

type ExpandedLinkState = {
  id: string;
  data: { link: LinkData; visits: Visit[] } | null;
  loading: boolean;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [links, setLinks] = useState<LinkData[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [expandedLink, setExpandedLink] = useState<ExpandedLinkState | null>(null);

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

    const fetchLinks = async () => {
      setLinksLoading(true);
      if (isAdmin) {
        const allLinks = await getAllLinksAdmin();
        setLinks(allLinks);
      } else {
        const token = getAnonymousToken();
        if (token) {
          const userLinks = await getLinksByToken(token);
          setLinks(userLinks);
        } else {
          setLinks([]);
        }
      }
      setLinksLoading(false);
    };

    fetchLinks();
  }, [isAdmin, authLoading]);

  const handleToggleExpand = async (linkId: string) => {
    if (expandedLink?.id === linkId) {
      setExpandedLink(null);
    } else {
      setExpandedLink({ id: linkId, data: null, loading: true });
      const analyticsData = await getLinkAnalytics(linkId);
      if (analyticsData.link) {
        setExpandedLink({ id: linkId, data: analyticsData, loading: false });
      } else {
        toast({ title: 'Error', description: 'Could not fetch link details.', variant: 'destructive' });
        setExpandedLink(null);
      }
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
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Short Link</TableHead>
                <TableHead className="hidden lg:table-cell">Original URL</TableHead>
                <TableHead className="text-center">Clicks</TableHead>
                {isAdmin && <TableHead className="hidden md:table-cell">Creator Token</TableHead>}
                <TableHead className="hidden sm:table-cell text-center">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linksLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 7 : 6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : links.length > 0 ? (
                links.map(link => (
                  <Collapsible asChild key={link.id} open={expandedLink?.id === link.id} onOpenChange={() => handleToggleExpand(link.id)}>
                    <>
                      <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer hover:bg-muted/50 data-[state=open]:bg-muted/50">
                              <TableCell>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                              </TableCell>
                              <TableCell className="font-medium">
                                  <a href={`/${link.shortId}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5">
                                      {`${origin.replace(/https?:\/\//, '')}/${link.shortId}`}
                                      <ExternalLink className="h-3 w-3" />
                                  </a>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell truncate max-w-sm">{link.longUrl}</TableCell>
                              <TableCell className="text-center font-semibold">{link.clicks}</TableCell>
                              {isAdmin && <TableCell className="hidden md:table-cell"><code className="text-xs bg-muted p-1 rounded">{link.anonymousToken.substring(0, 13)}...</code></TableCell>}
                              <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{format(new Date(link.createdAt), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={(e) => handleCopy(e, link.shortId)} aria-label="Copy link">
                                  {copiedLink === link.shortId ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                          </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                          <TableRow className="bg-background">
                              <TableCell colSpan={isAdmin ? 7 : 6} className="p-0">
                                  {expandedLink?.loading && expandedLink.id === link.id && (
                                    <div className="flex items-center justify-center p-8 gap-2">
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <span className="text-muted-foreground">Loading Analytics...</span>
                                    </div>
                                  )}
                                  {expandedLink?.data && expandedLink.id === link.id && (
                                    <DetailedAnalytics link={expandedLink.data.link} visits={expandedLink.data.visits} />
                                  )}
                              </TableCell>
                          </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center h-24 text-muted-foreground">
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
