import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyStation, getMyProfile, getCollabSectors } from "@/lib/queries";
import StationClient from "./station-client";

export const metadata = {
  title: "My Station — Orbit Station",
  description: "Manage your personal web shortcuts and sectors.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [station, profile, collabSectors] = await Promise.all([
    getMyStation(),
    getMyProfile(),
    getCollabSectors(),
  ]);

  return (
    <StationClient
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
        shortcuts: profile?.shortcuts ?? null,
        station: { isPublic: profile?.station?.isPublic ?? false },
      }}
    />
  );
}
