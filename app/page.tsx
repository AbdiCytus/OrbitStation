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
  },
  twitter: {
    title: "Orbit Station",
    description: "Build your station and showcase it to the universe.",
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/station");

  return <LandingClient />;
}
