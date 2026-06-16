import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Orbit Station",
  description:
    "Build your station and showcase it to the universe.",
  openGraph: {
    title: "Orbit Station",
    description: "Build your station and showcase it to the universe.",
    url: "/",
    images: ["/banner.png"],
  },
  twitter: {
    title: "Orbit Station",
    description: "Build your station and showcase it to the universe.",
    images: ["/banner.png"],
    card: "summary_large_image",
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/station");

  return <LandingClient />;
}
