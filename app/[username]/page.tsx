import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStation } from "@/lib/queries";
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

  return {
    title: `${data.user.name ?? username}'s Station — Orbit Station`,
    description: data.user.bio ?? `Explore ${data.user.name ?? username}'s web shortcuts on Orbit Station.`,
    openGraph: {
      title: `${data.user.name ?? username}'s Orbit Station`,
      description: data.user.bio ?? undefined,
      images: data.user.bannerUrl ? [data.user.bannerUrl] : [],
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

  if (!data) notFound();

  return <PublicProfileClient data={data} />;
}
