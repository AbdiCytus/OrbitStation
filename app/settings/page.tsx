import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/queries";
import SettingsClient from "./settings-client";
import StationNavbar from "@/components/station-navbar";
import SpaceBackground from "@/components/space-background";
import StaticStarfield from "@/components/static-starfield";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Orbit Station",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  const user = {
    id: session.user.id ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    callsign: profile.callsign ?? null,
  };

  const displayName = profile.callsign ?? profile.name ?? "Pilot";

  return (
    <div className={`settings-root${profile.animationEnabled ? "" : " no-animation"}`}>
      {profile.animationEnabled ? (
        <SpaceBackground key="on" variant="settings" animEnabled={true} />
      ) : (
        <StaticStarfield seed={42} />
      )}
      <StationNavbar
        user={user}
        displayName={displayName}
        hideSearch
      />
      <SettingsClient profile={{
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        image: profile.image,
        bio: profile.bio,
        bannerUrl: profile.bannerUrl,
        titleBadge: profile.titleBadge,
        callsign: profile.callsign,
        animationEnabled: profile.animationEnabled,
      }} />
    </div>
  );
}
