import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const station = await db.station.findUnique({
      where: { userId: session.user.id },
      include: { sectors: { orderBy: { order: "asc" } } }
    });

    if (!station) {
      return NextResponse.json({ message: "Station not found" }, { status: 404 });
    }

    const origin = request.headers.get("origin") || "*";
    return NextResponse.json({ sectors: station.sectors }, { 
      headers: { 
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
