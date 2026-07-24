import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, username, callsign, bio, bannerUrl, titleBadge, animationEnabled, hologramEnabled, allowFriendRequests, staticBackgroundEnabled, notifSoundEnabled, notifSoundUrl, shortcuts, isPublic, image, currentPassword, newPassword } = body;

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
    let newPasswordHash: string | undefined = undefined;
    
    if (newPassword) {
      const user = await db.user.findUnique({ where: { id: session.user.id } });
      if (user?.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
        }
        const bcrypt = await import("bcryptjs");
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }
      }
      
      const bcrypt = await import("bcryptjs");
      newPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        ...(username !== undefined && { username: username.trim() || null }),
        ...(callsign !== undefined && { callsign: callsign.trim() || null }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
        ...(bannerUrl !== undefined && { bannerUrl: bannerUrl.trim() || null }),
        ...(animationEnabled !== undefined && { animationEnabled: Boolean(animationEnabled) }),
        ...(hologramEnabled !== undefined && { hologramEnabled: Boolean(hologramEnabled) }),
        ...(allowFriendRequests !== undefined && { allowFriendRequests: Boolean(allowFriendRequests) }),
        ...(staticBackgroundEnabled !== undefined && { staticBackgroundEnabled: Boolean(staticBackgroundEnabled) }),
        ...(notifSoundEnabled !== undefined && { notifSoundEnabled: Boolean(notifSoundEnabled) }),
        ...(notifSoundUrl !== undefined && { notifSoundUrl: notifSoundUrl.trim() || null }),
        ...(shortcuts !== undefined && { shortcuts }),
        ...(image !== undefined && { image }),
        ...(newPasswordHash && { password: newPasswordHash }),
      },
    });

    // Verify Title Badge Eligibility
    if (titleBadge !== undefined) {
      const trimmedBadge = titleBadge.trim() || null;
      if (trimmedBadge) {
        // We import dynamically to avoid polluting the file scope
        const { getUnlockedBadges } = await import("@/lib/badges");
        const unlockedBadges = await getUnlockedBadges(session.user.id);
        if (unlockedBadges.includes(trimmedBadge)) {
          await db.user.update({
            where: { id: session.user.id },
            data: { titleBadge: trimmedBadge }
          });
        }
      } else {
        await db.user.update({
          where: { id: session.user.id },
          data: { titleBadge: null }
        });
      }
    }
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
