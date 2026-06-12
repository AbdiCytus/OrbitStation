import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Orbit Station",
    template: "%s — Orbit Station",
  },
  description:
    "Your personal web portal in the stars. Organize, navigate, and share your favorite web destinations from one command center.",
  keywords: ["web portal", "bookmark manager", "link shortcut", "orbit station"],
  authors: [{ name: "Orbit Station" }],
  openGraph: {
    title: "Orbit Station",
    description: "Your personal web portal in the stars.",
    type: "website",
    siteName: "Orbit Station",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit Station",
    description: "Your personal web portal in the stars.",
  },
};

import MouseTrail from "@/components/mouse-trail";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <MouseTrail />
        {children}
      </body>
    </html>
  );
}
