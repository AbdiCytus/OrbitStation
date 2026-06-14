const fs = require('fs');
fs.appendFileSync('lib/actions.ts', `

export async function recordStationVisit(stationId: string, visitorId?: string) {
  try {
    await db.stationVisit.create({
      data: {
        stationId,
        visitorId: visitorId || null
      }
    });
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getStationAnalytics(stationId: string) {
  try {
    const totalVisits = await db.stationVisit.count({ where: { stationId } });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentVisits = await db.stationVisit.findMany({
      where: {
        stationId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const uniqueVisitors = await db.stationVisit.groupBy({
      by: ['visitorId'],
      where: { stationId, visitorId: { not: null } },
      _count: true,
    });

    const topBeacons = await db.beacon.findMany({
      where: { sector: { stationId } },
      orderBy: { visits: 'desc' },
      take: 5,
      select: { title: true, visits: true, imageUrl: true }
    });

    return { totalVisits, recentVisits, uniqueVisitorCount: uniqueVisitors.length, topBeacons };
  } catch (e: any) {
    return { error: e.message };
  }
}
`);
