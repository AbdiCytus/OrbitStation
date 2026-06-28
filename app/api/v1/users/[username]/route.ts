import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ============================================================
// GET /api/v1/users/[username]
// Endpoint Publik: Mengembalikan data profil & Station yang BERSTATUS PUBLIK
// ============================================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Ambil user berdasar username, dan HANYA tarik data relasi yang berstatus publik
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true, // ID tetap diekspos untuk referensi relasi (umum di public API)
        name: true,
        username: true,
        image: true,
        bio: true,
        bannerUrl: true,
        titleBadge: true,
        callsign: true,
        animationEnabled: true,
        hologramEnabled: true,
        staticBackgroundEnabled: true,
        createdAt: true,
        // TIDAK MENGAMBIL: email, emailVerified, password, notifSoundUrl, dsb.

        station: {
          where: { isPublic: true },
          select: {
            id: true,
            description: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
            sectors: {
              where: { isPublic: true },
              orderBy: { order: "asc" },
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
                order: true,
                isPublic: true,
                beacons: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    url: true,
                    title: true,
                    description: true,
                    imageUrl: true,
                    faviconUrl: true,
                    isPinned: true,
                    order: true,
                    visits: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[GET /api/v1/users/[username]] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
