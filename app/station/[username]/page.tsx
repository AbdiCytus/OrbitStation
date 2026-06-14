import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStation } from "@/lib/queries";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import PublicProfileClient from "./public-profile-client";

// Memoize so generateMetadata and Page share the same fetch
const getStation = cache(async (username: string) => {
  return getPublicStation(username);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getStation(username);

  if (!data) {
    return { title: "User not found — Orbit Station" };
  }

  const allBeaconsCount = data.station.sectors.reduce((acc, s) => acc + s.beacons.length, 0);
  const statsStr = `${data.station.sectors.length} Sectors · ${allBeaconsCount} Beacons`;
  
  const searchParams = new URLSearchParams();
  searchParams.set("name", data.user.name ?? username);
  searchParams.set("username", username);
  if (data.user.bio) searchParams.set("bio", data.user.bio);
  searchParams.set("stats", statsStr);
  if (data.user.image) searchParams.set("avatar", data.user.image);
  
  const ogImageRoute = `/api/og?${searchParams.toString()}`;

  return {
    title: `${data.user.name ?? username}'s Station — Orbit Station`,
    description: data.user.bio ?? `Explore ${data.user.name ?? username}'s web shortcuts on Orbit Station.`,
    openGraph: {
      title: `${data.user.name ?? username}'s Orbit Station`,
      description: data.user.bio ?? undefined,
      images: [ogImageRoute],
      type: "profile",
      url: `/station/${username}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.user.name ?? username}'s Orbit Station`,
      description: data.user.bio ?? undefined,
      images: [ogImageRoute],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getStation(username);
  const session = await auth();

  let sessionUser = session?.user || null;
  if (sessionUser?.id) {
    const dbUser = await db.user.findUnique({ where: { id: sessionUser.id }, select: { animationEnabled: true, image: true, name: true, callsign: true } });
    if (dbUser) {
      sessionUser = { ...sessionUser, animationEnabled: dbUser.animationEnabled, image: dbUser.image || sessionUser.image, name: dbUser.name || sessionUser.name, callsign: dbUser.callsign } as any;
    }
  }

  if (!data) notFound();

  return <PublicProfileClient data={data} sessionUser={sessionUser} />;
}
