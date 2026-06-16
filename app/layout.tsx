import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0F0F13",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Orbit Station",
    template: "%s — Orbit Station",
  },
  description:
    "Your personal web portal in the stars. Organize, navigate, and share your favorite web destinations from one command center.",
  keywords: ["web portal", "bookmark manager", "link shortcut", "orbit station", "productivity"],
  authors: [{ name: "Orbit Station" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Orbit Station",
    description: "Your personal web portal in the stars.",
    type: "website",
    siteName: "Orbit Station",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Orbit Station - Your Personal Web Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit Station",
    description: "Your personal web portal in the stars.",
    images: ["/banner.png"],
  },
};

import MouseTrail from "@/components/mouse-trail";
import { Toaster } from "sonner";
import PwaRegister from "@/components/pwa-register";

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
        <PwaRegister />
        <MouseTrail />
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 35, 0.9)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(139, 92, 246, 0.2)",
              backdropFilter: "blur(12px)",
              color: "#e2e8f0",
              borderRadius: "12px",
            },
            className: "font-sans",
          }}
        />
        {children}
      </body>
    </html>
  );
}
