import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyStation, getMyProfile, getCollabSectors, getVisitedStation } from "@/lib/queries";
import StationClient from "./station-client";

export const metadata = {
  title: "My Station",
  description: "Manage your personal web shortcuts and sectors.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StationPage(
  props: { searchParams?: Promise<{ visit?: string }> }
) {
  const searchParams = await props.searchParams;
  const visitUsername = searchParams?.visit;

  const session = await auth();
  if (!session?.user) redirect("/login");

  let station: any = null;
  let collabSectors: any[] = [];
  let visitingProfile: any = null;
  const profile = await getMyProfile();

  if (visitUsername && profile?.username !== visitUsername) {
    station = await getVisitedStation(visitUsername);
    if (!station) {
      redirect("/station");
    }
    visitingProfile = {
      id: station.userId,
      username: visitUsername,
      name: station.sectors[0]?.station?.user?.name || visitUsername,
      image: station.sectors[0]?.station?.user?.image || null
    };
    collabSectors = [];
  } else {
    [station, collabSectors] = await Promise.all([
      getMyStation(),
      getCollabSectors(),
    ]);
  }

  return (
    <StationClient
      visitingProfile={visitingProfile}
      initialStation={station}
      initialCollabSectors={collabSectors}
      user={{
        id: session.user.id ?? "",
        name: profile?.name ?? session.user.name ?? null,
        username: profile?.username ?? null,
        image: profile?.image ?? session.user.image ?? null,
        callsign: profile?.callsign ?? null,
        animationEnabled: profile?.animationEnabled ?? true,
        staticBackgroundEnabled: (profile as any)?.staticBackgroundEnabled ?? false,
        hologramEnabled: (profile as any)?.hologramEnabled ?? true,
        saveFilterSortEnabled: (profile as any)?.saveFilterSortEnabled ?? false,
        shortcuts: profile?.shortcuts ?? null,
        station: { isPublic: profile?.station?.isPublic ?? false },
      }}
    />
  );
}
