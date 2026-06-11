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
  
  const ogUrl = new URL(`https://orbit-station.vercel.app/api/og`); // Replace with your actual domain later
  ogUrl.searchParams.set("name", data.user.name ?? username);
  ogUrl.searchParams.set("username", username);
  if (data.user.bio) ogUrl.searchParams.set("bio", data.user.bio);
  ogUrl.searchParams.set("stats", statsStr);
  if (data.user.image) ogUrl.searchParams.set("avatar", data.user.image);

  return {
    title: `${data.user.name ?? username}'s Station — Orbit Station`,
    description: data.user.bio ?? `Explore ${data.user.name ?? username}'s web shortcuts on Orbit Station.`,
    openGraph: {
      title: `${data.user.name ?? username}'s Orbit Station`,
      description: data.user.bio ?? undefined,
      images: [ogUrl.toString()],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.user.name ?? username}'s Orbit Station`,
      description: data.user.bio ?? undefined,
      images: [ogUrl.toString()],
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
    const dbUser = await db.user.findUnique({ where: { id: sessionUser.id }, select: { animationEnabled: true } });
    if (dbUser) {
      sessionUser = { ...sessionUser, animationEnabled: dbUser.animationEnabled } as any;
    }
  }

  if (!data) notFound();

  return <PublicProfileClient data={data} sessionUser={sessionUser} />;
}
