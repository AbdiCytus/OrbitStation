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

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: "ACCEPTED",
      },
      include: {
        requester: { select: { id: true, name: true, username: true, image: true, callsign: true } },
        receiver: { select: { id: true, name: true, username: true, image: true, callsign: true } }
      }
    });

    const friendsList = friendships.map(f => f.requesterId === userId ? f.receiver : f.requester);

    return NextResponse.json({ success: true, data: friendsList }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
