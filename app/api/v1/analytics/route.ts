import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUserId } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip, 100, 60000)) {
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429, headers: CORS_HEADERS });
    }

    const userIdOrResponse = await getApiUserId(req);
    if (typeof userIdOrResponse !== "string") {
      const res = userIdOrResponse;
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const userId = userIdOrResponse;

    const station = await db.station.findUnique({ where: { userId } });
    
    let totalStationVisits = 0;
    if (station) {
      totalStationVisits = await db.stationVisit.count({ where: { stationId: station.id } });
    }

    const beacons = await db.beacon.findMany({
      where: { creatorId: userId },
      select: { visits: true }
    });
    
    const totalBeaconVisits = beacons.reduce((acc, b) => acc + (b.visits || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalStationVisits,
        totalBeaconVisits,
        totalBeacons: beacons.length
      }
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
