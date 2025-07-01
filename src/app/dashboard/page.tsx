
'use client';

import { useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/auth';
import { getLinkAnalytics, deleteLink } from '@/lib/actions';
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
import { Clipboard, Check, ExternalLink, ChevronDown, ChevronUp, LogOut, Loader2, User as UserIcon, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DetailedAnalytics } from '@/components/dashboard/DetailedAnalytics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { QrCodeModal } from '@/components/dashboard/QrCodeModal';

type AnalyticsCache = Record<string, { link: LinkData; visits: Visit[] }>;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [links, setLinks] = useState<LinkData[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [analyticsCache, setAnalyticsCache] = useState<AnalyticsCache>({});

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<LinkData | null>(null);

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
  
    const isStale = analyticsCache[docId] && analyticsCache[docId].link.clicks !== clicks;
    const shouldFetch = !analyticsCache[docId] || isStale;
  
    if (shouldFetch) {
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
      }
    }
  };

  const handleCopy = (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    const url = `${origin}/${shortId}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied to clipboard!' });
    setCopiedLink(shortId);
    setTimeout(() => setCopiedLink(null), 2000);
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleDeleteClick = (e: React.MouseEvent, link: LinkData) => {
    e.stopPropagation();
    setLinkToDelete(link);
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;

    setIsDeleting(true);
    try {
      const token = isAdmin ? undefined : getAnonymousToken();
      const result = await deleteLink(linkToDelete.id, linkToDelete.shortId, isAdmin, token);
      
      if (result.success) {
        toast({ title: "Link deleted successfully!" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete link.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setLinkToDelete(null);
    }
  };

  const getExpiryInfo = (link: LinkData) => {
    if (!link.expiresAt) {
      return <span className="text-green-600 font-medium">Never</span>;
    }
    if (link.expiresAt < Date.now()) {
      return <span className="text-destructive">Expired</span>;
    }
    return `in ${formatDistanceToNow(new Date(link.expiresAt))}`;
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
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-full">Short Link</TableHead>
                <TableHead className="hidden xl:table-cell w-full">Original URL</TableHead>
                <TableHead className="w-20 text-center">Clicks</TableHead>
                {isAdmin && <TableHead className="hidden md:table-cell w-40">Creator Token</TableHead>}
                <TableHead className="hidden sm:table-cell w-28 text-center">Created</TableHead>
                <TableHead className="hidden sm:table-cell w-32 text-center">Expires</TableHead>
                <TableHead className="hidden lg:table-cell w-24 text-center">QR Code</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            {linksLoading ? (
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 9 : 8}><Skeleton className="h-8 w-full" /></TableCell>
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
                                <span className="block truncate">
                                    {`${origin.replace(/https?:\/\//, '')}/${link.shortId}`}
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="block truncate">{link.longUrl}</span>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{link.clicks}</TableCell>
                        {isAdmin && <TableCell className="hidden md:table-cell"><code className="text-xs bg-muted p-1 rounded block truncate">{link.anonymousToken}</code></TableCell>}
                        <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{format(new Date(link.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center text-muted-foreground text-xs">{getExpiryInfo(link)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <QrCodeModal url={`${origin}/${link.shortId}`} shortId={link.shortId} />
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleCopy(e, link.shortId)} aria-label="Copy link">
                                {copiedLink === link.shortId ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                              </Button>
                              <AlertDialog open={linkToDelete?.id === link.id} onOpenChange={(open) => !open && setLinkToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={(e) => handleDeleteClick(e, link)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </AlertDialogTrigger>
                              </AlertDialog>
                           </div>
                        </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                        <TableRow className="bg-background">
                            <TableCell colSpan={isAdmin ? 9 : 8} className="p-0">
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
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center h-24 text-muted-foreground">
                    You haven't created any links yet.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>
        {linkToDelete && (
             <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the link <span className="font-semibold text-foreground">{origin}/{linkToDelete.shortId}</span> and all its associated analytics data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
