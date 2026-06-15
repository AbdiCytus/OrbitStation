import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyStation, getMyProfile } from "@/lib/queries";
import { getStationAnalytics } from "@/lib/actions";
import AnalyticsClient from "./analytics-client";

export const metadata = {
  title: "Analytics — Orbit Station",
  description: "View analytics for your public profile.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [station, profile] = await Promise.all([
    getMyStation(),
    getMyProfile(),
  ]);

  if (!station) redirect("/station");

  const analytics = await getStationAnalytics(station.id);

  return (
    <AnalyticsClient
      analytics={analytics}
      user={{
        id: session.user.id ?? "",
        name: profile?.name ?? session.user.name ?? null,
        username: profile?.username ?? null,
        image: profile?.image ?? session.user.image ?? null,
        callsign: profile?.callsign ?? null,
        animationEnabled: profile?.animationEnabled ?? true,
        staticBackgroundEnabled: (profile as any)?.staticBackgroundEnabled ?? false,
      }}
      isPublicProfile={station.isPublic}
    />
  );
}
