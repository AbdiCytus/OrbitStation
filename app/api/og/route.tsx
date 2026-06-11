import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // dynamically generated parameters
    const name = searchParams.get('name') ?? 'Orbit Station';
    const username = searchParams.get('username') ?? 'user';
    const bio = searchParams.get('bio') ?? 'Exploring the cosmos of the internet.';
    const stats = searchParams.get('stats') ?? '0 Sectors · 0 Beacons';
    const avatar = searchParams.get('avatar');
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at 50% -20%, #2f1d5e 0%, #0a0a0a 60%)',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* Logo */}
          <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', fontSize: 32, fontWeight: 'bold', color: '#a78bfa', letterSpacing: '-0.02em' }}>
            ⊕ Orbit Station
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                width={150}
                height={150}
                style={{
                  borderRadius: 75,
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 0 60px rgba(124, 92, 252, 0.5)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  backgroundColor: '#1f1f22',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 72,
                  color: 'white',
                  boxShadow: '0 0 60px rgba(124, 92, 252, 0.5)',
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
              <div style={{ fontSize: 64, fontWeight: 'bold', letterSpacing: '-0.02em', textAlign: 'center' }}>
                {name}
              </div>
              <div style={{ fontSize: 32, color: '#a1a1aa', marginTop: 5 }}>
                @{username}
              </div>
            </div>

            {bio && (
              <div style={{ fontSize: 28, color: '#d4d4d8', maxWidth: 800, textAlign: 'center', marginTop: 20, lineHeight: 1.4 }}>
                {bio}
              </div>
            )}

            <div style={{ display: 'flex', marginTop: 30, padding: '10px 30px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, color: '#e4e4e7' }}>
                {stats}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
