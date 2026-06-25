import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, username, callsign, bio, bannerUrl, titleBadge, animationEnabled, hologramEnabled, allowFriendRequests, staticBackgroundEnabled, notifSoundEnabled, notifSoundUrl, shortcuts, isPublic, image } = body;

  // Validate username uniqueness if changed
  if (username) {
    const existing = await db.user.findFirst({
      where: { username, NOT: { id: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
  }

  try {
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        ...(username !== undefined && { username: username.trim() || null }),
        ...(callsign !== undefined && { callsign: callsign.trim() || null }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
        ...(bannerUrl !== undefined && { bannerUrl: bannerUrl.trim() || null }),
        ...(titleBadge !== undefined && { titleBadge: titleBadge.trim() || null }),
        ...(animationEnabled !== undefined && { animationEnabled: Boolean(animationEnabled) }),
        ...(hologramEnabled !== undefined && { hologramEnabled: Boolean(hologramEnabled) }),
        ...(allowFriendRequests !== undefined && { allowFriendRequests: Boolean(allowFriendRequests) }),
        ...(staticBackgroundEnabled !== undefined && { staticBackgroundEnabled: Boolean(staticBackgroundEnabled) }),
        ...(notifSoundEnabled !== undefined && { notifSoundEnabled: Boolean(notifSoundEnabled) }),
        ...(notifSoundUrl !== undefined && { notifSoundUrl: notifSoundUrl.trim() || null }),
        ...(shortcuts !== undefined && { shortcuts }),
        ...(image !== undefined && { image: image || null }),
      },
    });



    if (isPublic !== undefined) {
      await db.station.upsert({
        where: { userId: session.user.id },
        update: { isPublic: Boolean(isPublic) },
        create: { userId: session.user.id, isPublic: Boolean(isPublic) },
      });
    }

    const res = NextResponse.json({ data: updated });
    
    if (animationEnabled !== undefined) {
      res.cookies.set("animationEnabled", String(animationEnabled), { maxAge: 60 * 60 * 24 * 365, path: "/" });
    }

    return res;
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
