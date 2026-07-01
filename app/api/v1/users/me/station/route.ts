import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUserId } from "@/lib/api-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ============================================================
// GET /api/v1/users/me/station
// Mengembalikan data Station, Sector, dan Beacon milik user
// ============================================================
export async function GET(req: Request) {
  try {
    // 1. Authenticate Request
    const userIdOrResponse = await getApiUserId(req);
    if (typeof userIdOrResponse !== "string") {
      const res = userIdOrResponse;
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const userId = userIdOrResponse;

    // 2. Fetch Station with Sectors & Beacons
    const station = await db.station.findUnique({
      where: { userId },
      include: {
        sectors: {
          orderBy: { order: "asc" }, // Urutkan sektor sesuai tampilan
          include: {
            beacons: {
              orderBy: { order: "asc" }, // Urutkan beacon sesuai urutannya
            },
          },
        },
      },
    });

    if (!station) {
      return NextResponse.json(
        { success: false, message: "Station not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 3. Return JSON response
    return NextResponse.json(
      { success: true, data: station },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[GET /api/v1/users/me/station] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
