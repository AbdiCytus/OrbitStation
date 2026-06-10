import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyStation, getMyProfile } from "@/lib/queries";
import StationClient from "./station-client";

export const metadata = {
  title: "My Station — Orbit Station",
  description: "Manage your personal web shortcuts and sectors.",
};

export default async function StationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [station, profile] = await Promise.all([
    getMyStation(),
    getMyProfile(),
  ]);

  return (
    <StationClient
      initialStation={station}
      user={{
        id: session.user.id ?? "",
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        callsign: profile?.callsign ?? null,
        animationEnabled: profile?.animationEnabled ?? true,
      }}
    />
  );
}
