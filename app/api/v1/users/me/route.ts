import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUserId } from "@/lib/api-auth";

// Common CORS headers to allow cross-origin requests from OAuth clients
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ============================================================
// GET /api/v1/users/@me
// Mengembalikan data profil lengkap dari user yang terautentikasi
// ============================================================
export async function GET(req: Request) {
  try {
    // 1. Authenticate Request
    const userIdOrResponse = await getApiUserId(req);
    if (typeof userIdOrResponse !== "string") {
      // Inject CORS headers to error response
      const res = userIdOrResponse;
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const userId = userIdOrResponse;

    // 2. Fetch User Profile
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        bannerUrl: true,
        titleBadge: true,
        callsign: true,
        animationEnabled: true,
        hologramEnabled: true,
        staticBackgroundEnabled: true,
        allowFriendRequests: true,
        notifSoundEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 3. Return JSON response
    return NextResponse.json(
      { success: true, data: user },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[GET /api/v1/users/@me] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
