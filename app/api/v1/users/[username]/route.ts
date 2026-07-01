import { NextResponse } from "next/server";
import { getPublicStation } from "@/lib/queries";

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

    // Gunakan fungsi yang sama dengan web UI agar konsisten 100%
    const rawData = await getPublicStation(username);

    if (!rawData) {
      return NextResponse.json(
        { success: false, message: "User not found or public station is disabled" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Ubah format agar sesuai dengan kontrak API lama / dokumentasi API
    const data = {
      ...rawData.user,
      station: rawData.station,
    };

    return NextResponse.json(
      { success: true, data },
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
