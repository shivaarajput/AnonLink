
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, Link as LinkIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'My Links' },
  { href: '/admin/login', label: 'Admin' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">AnonLink</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
                <Link 
                    key={link.href} 
                    href={link.href} 
                    className={cn(
                        "transition-colors hover:text-foreground/80",
                        pathname === link.href ? "text-foreground" : "text-foreground/60"
                    )}
                >
                  {link.label}
                </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-between w-full">
           <Link href="/" className="flex items-center space-x-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">AnonLink</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
                    <LinkIcon className="h-6 w-6" />
                    <span>AnonLink</span>
                </Link>
                {navLinks.map((link) => (
                  <Button 
                    key={link.href} 
                    asChild 
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    className="justify-start text-lg h-12"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
