import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Orbit Station — Your Personal Web Portal in the Stars",
  description:
    "Organize your favorite web shortcuts into Sectors. Access them anytime from your personal Station.",
  openGraph: {
    title: "Orbit Station — Your Personal Web Portal",
    description: "Organize your favorite web shortcuts into Sectors. Access them anytime from your personal Station.",
    url: "/",
  },
  twitter: {
    title: "Orbit Station — Your Personal Web Portal",
    description: "Organize your favorite web shortcuts into Sectors. Access them anytime from your personal Station.",
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/station");

  return <LandingClient />;
}
