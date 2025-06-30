'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QrCodeModalProps {
  url: string;
  shortId: string;
}

export function QrCodeModal({ url, shortId }: QrCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${shortId}-qrcode.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AnonLink Short URL',
          text: `Check out this link: ${url}`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: 'Sharing failed', description: 'Could not share the link.', variant: 'destructive' });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Web Share API not supported, link copied instead.' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Show QR Code" onClick={(e) => e.stopPropagation()}>
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code for {shortId}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-4">
          <div ref={qrRef} className="p-4 bg-white rounded-lg">
            <QRCodeCanvas value={url} size={256} includeMargin={true} />
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
            <Button onClick={handleShare} variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
