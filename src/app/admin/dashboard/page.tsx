
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/auth';
import { getAllLinksAdmin } from '@/lib/actions';
import { LinkWithAnalytics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AnalyticsModal } from '@/components/admin/AnalyticsModal';
import { LogOut, Loader2, ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
    const [links, setLinks] = useState<LinkWithAnalytics[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const adminStatus = await checkIsAdmin(currentUser);
                if (adminStatus) {
                    setIsAdmin(true);
                    const allLinks = await getAllLinksAdmin();
                    setLinks(allLinks);
                } else {
                    router.replace('/admin/login');
                }
            } else {
                router.replace('/admin/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-destructive">
                <ShieldAlert className="h-12 w-12" />
                <h1 className="text-2xl font-bold mt-4">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>View and manage all shortened links across the platform.</CardDescription>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
                    <Button onClick={handleSignOut} variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Short Link</TableHead>
                                <TableHead className="hidden lg:table-cell">Original URL</TableHead>
                                <TableHead className="text-center">Clicks</TableHead>
                                <TableHead className="hidden md:table-cell">Creator Token</TableHead>
                                <TableHead className="text-right">Analytics</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.map(link => (
                                <TableRow key={link.id}>
                                    <TableCell className="font-medium">/{link.shortId}</TableCell>
                                    <TableCell className="hidden lg:table-cell truncate max-w-sm">{link.longUrl}</TableCell>
                                    <TableCell className="text-center font-semibold">{link.clicks}</TableCell>
                                    <TableCell className="hidden md:table-cell"><code className="text-xs bg-muted p-1 rounded">{link.anonymousToken.substring(0, 13)}...</code></TableCell>
                                    <TableCell className="text-right">
                                        <AnalyticsModal shortId={link.shortId} />
                                    </TableCell>
                                </TableRow>
                            ))}
                             {links.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No links have been created yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
