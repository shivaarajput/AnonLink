
import { getLongUrl } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Redirector from '@/components/Redirector';

interface Props {
  params: { shortId: string };
}

export default async function ShortLinkPage({ params }: Props) {
  const { shortId } = params;
  
  if (!shortId || shortId.length > 10) {
      notFound();
  }

  const longUrl = await getLongUrl(shortId);

  if (!longUrl) {
    notFound();
  }

  return <Redirector longUrl={longUrl} shortId={shortId} />;
}
