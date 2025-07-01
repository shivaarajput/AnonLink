'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createShortLink } from '@/lib/actions';
import { getAnonymousToken } from '@/lib/store';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/auth';

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

// A helper function to add a timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`The operation timed out. This is often caused by incorrect Firebase project setup. Please ensure your Firestore security rules allow writes to the 'links' collection and that your API keys in '.env.local' are correct.`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminStatus = await checkIsAdmin(user);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const token = getAnonymousToken();
      
      const result = await withTimeout(createShortLink(values.url, token, isAdmin), 10000); // 10 second timeout

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.shortId) {
        toast({
          title: 'Success!',
          description: 'Your URL has been shortened.',
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">AnonLink</CardTitle>
          <CardDescription>Shorten URLs anonymously and securely. No account needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/very-long-url-to-shorten" 
                        {...field} 
                        className="h-12 text-lg text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg" disabled={form.formState.isSubmitting || !authChecked}>
                {form.formState.isSubmitting || !authChecked ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-5 w-5" />
                )}
                {form.formState.isSubmitting ? 'Shortening...' : 'Shorten URL'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
