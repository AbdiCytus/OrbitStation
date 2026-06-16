import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Handle CORS for Chrome Extension
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(request: Request) {
  try {
    // Note: If calling from a Chrome Extension, ensure you send an authentication token 
    // (e.g. Bearer token in Headers) if cookies aren't passed automatically across origins.
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized. Please login to OrbStation." }, { status: 401 });
    }

    const { title, url, sectorId, description, imageUrl } = await request.json();

    if (!url || !title) {
      return NextResponse.json({ message: "Missing title or url" }, { status: 400 });
    }

    // Cari Station user
    const station = await db.station.findUnique({
      where: { userId: session.user.id },
      include: { sectors: true }
    });

    if (!station || station.sectors.length === 0) {
      return NextResponse.json({ message: "No sectors found to save the beacon." }, { status: 400 });
    }

    // Gunakan sectorId dari request, atau fallback ke sector pertama
    const targetSectorId = sectorId || station.sectors.sort((a, b) => a.order - b.order)[0].id;

    const lastBeacon = await db.beacon.findFirst({
      where: { sectorId: targetSectorId },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastBeacon?.order ?? -1) + 1;

    const beacon = await db.beacon.create({
      data: {
        sectorId: targetSectorId,
        url: url,
        title: title,
        description: description || null,
        imageUrl: imageUrl || null,
        order: newOrder,
        creatorId: session.user.id
      }
    });

    const origin = request.headers.get("origin") || "*";
    return NextResponse.json({ success: true, beacon }, { 
      headers: { 
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
      } 
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
