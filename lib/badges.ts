import { db } from "./db";
import { BADGE_REGISTRY, BADGE_COLORS } from "./badges/registry";

export const BADGE_CHECKS: Record<string, (userId: string) => Promise<boolean>> = {
  "rookie-pilot": async () => true,
  "sector-magnate": async (userId: string) => {
    const station = await db.station.findUnique({
      where: { userId },
      include: {
        sectors: {
          include: {
            _count: { select: { beacons: true } }
          }
        }
      }
    });
    if (!station) return false;
    if (station.sectors.length < 7) return false;
    const totalBeacons = station.sectors.reduce((acc: number, s: any) => acc + s._count.beacons, 0);
    return totalBeacons >= 35;
  },
  "viral-voyager": async (userId: string) => {
    const viralBeacons = await db.beacon.count({
      where: {
        creatorId: userId,
        visits: { gte: 1000 }
      }
    });
    return viralBeacons >= 5;
  },
  "social-butterfly": async (userId: string) => {
    const friendsCount = await db.friendship.count({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: "ACCEPTED"
      }
    });
    return friendsCount >= 20;
  },
  "collaborative-spirit": async (userId: string) => {
    const collabCount = await db.sectorCollaborator.count({
      where: { userId } 
    });
    return collabCount >= 10;
  },
  "guild-master": async (userId: string) => {
    const sectors = await db.sector.findMany({
      where: { station: { userId } },
      include: { _count: { select: { collaborators: true } } }
    });
    return sectors.some((s: any) => s._count.collaborators >= 100);
  },
  "early-adopter": async (userId: string) => {
    const user = await db.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    if (!user) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return user.createdAt <= thirtyDaysAgo;
  },
  "data-hoarder": async (userId: string) => {
    const count = await db.beacon.count({
      where: { creatorId: userId }
    });
    return count >= 100;
  },
  "chatterbox": async (userId: string) => {
    const messages = await db.chatMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true }
    });
    const uniqueFriends = new Set(messages.map((m: any) => m.receiverId)).size;
    return messages.length >= 100 && uniqueFriends >= 15;
  },
  "cosmic-explorer": async (userId: string) => {
    const count = await db.stationVisit.count({
      where: { visitorId: userId }
    });
    return count >= 100;
  },
  "sector-heiress": async (userId: string) => {
    const transfers = await db.chatMessage.findMany({
      where: { receiverId: userId, type: "OWNERSHIP_TRANSFER_ACCEPTED" },
      select: { metadata: true }
    });
    const uniqueSectors = new Set<string>();
    transfers.forEach((t: any) => {
      if (t.metadata) {
        try {
          const m = JSON.parse(t.metadata);
          if (m.sectorId) uniqueSectors.add(m.sectorId);
        } catch (e) {}
      }
    });
    return uniqueSectors.size >= 50;
  },
  "prominent-admin": async (userId: string) => {
    const count = await db.sectorCollaborator.count({
      where: { userId, role: "ADMIN" }
    });
    return count >= 8;
  },
  "galactic-center": async (userId: string) => {
    const count = await db.stationVisit.count({
      where: { station: { userId } }
    });
    return count >= 100000;
  },
  "reliable-contributor": async (userId: string) => {
    const beacons = await db.beacon.findMany({
      where: { creatorId: userId, sector: { station: { userId: { not: userId } } } },
      select: { sectorId: true }
    });
    const uniqueSectors = new Set(beacons.map((b: any) => b.sectorId)).size;
    return beacons.length >= 10 && uniqueSectors >= 5;
  },
  "the-creator": async (userId: string) => {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    return user?.email === "abdiprayuda89@gmail.com" || user?.email?.includes("abdi"); 
  },
  "the-creator-assistant": async (userId: string) => {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, username: true } });
    return user?.username === "antigravity" || user?.username === "assistant";
  }
};

export async function getUnlockedBadges(userId: string): Promise<string[]> {
  // DEV MODE BYPASS: Unlock all badges for easy testing
  if (process.env.NODE_ENV === "development") {
    return BADGE_REGISTRY.map(b => b.id);
  }

  const unlocked: string[] = [];
  
  const checks = BADGE_REGISTRY.map(async (badge: any) => {
    try {
      const checkFn = BADGE_CHECKS[badge.id];
      if (checkFn) {
        const isEligible = await checkFn(userId);
        if (isEligible) {
          unlocked.push(badge.id);
        }
      }
    } catch (err) {
      console.error(`Failed to check eligibility for ${badge.id}:`, err);
    }
  });

  await Promise.all(checks);
  return unlocked;
}

export { BADGE_REGISTRY, BADGE_COLORS, getBadgeById } from "./badges/registry";
