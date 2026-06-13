import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Orbit Station",
  description: "Sign in to your Orbit Station or create a new account to start organizing your web portal.",
  openGraph: {
    title: "Sign In — Orbit Station",
    description: "Sign in to your Orbit Station or create a new account to start organizing your web portal.",
    url: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
