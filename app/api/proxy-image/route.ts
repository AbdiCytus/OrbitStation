import { NextResponse } from 'next/server';
import { isSafeUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url || !isSafeUrl(url)) {
    return new NextResponse('Missing or invalid url', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!response.ok) {
      console.error('Proxy fetch failed for URL:', url, 'Status:', response.status);
      return NextResponse.redirect(`https://corsproxy.io/?${encodeURIComponent(url)}`, 302);
    }
    
    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Proxy fetch threw error, redirecting to fallback:', error);
    return NextResponse.redirect(`https://corsproxy.io/?${encodeURIComponent(url)}`, 302);
  }
}
