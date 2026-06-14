import { auth } from "@/auth";
import { db } from "@/lib/db";
import ProfileNotFoundClient from "./profile-not-found-client";

export default async function NotFound() {
  const session = await auth();
  let staticBackgroundEnabled = false;
  let animationEnabled = true;

  if (session?.user?.id) {
    const user = await db.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { staticBackgroundEnabled: true, animationEnabled: true } 
    });
    if (user) {
      staticBackgroundEnabled = (user as any).staticBackgroundEnabled ?? false;
      animationEnabled = user.animationEnabled ?? true;
    }
  }

  return (
    <ProfileNotFoundClient 
      staticBackgroundEnabled={staticBackgroundEnabled} 
      animationEnabled={animationEnabled} 
    />
  );
}
