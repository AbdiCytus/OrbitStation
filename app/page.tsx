import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

export const metadata: Metadata = {
  title: "Orbit Station — Your Personal Web Portal in the Stars",
  description:
    "Organize your favorite web shortcuts into Sectors. Access them anytime from your personal Station.",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/station");

  return (
    <main className="landing-root">
      {/* Animated background */}
      <div className="station-bg" aria-hidden="true">
        <div className="nebula-blob nb1" />
        <div className="nebula-blob nb2" />
        <div className="landing-stars" />
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <span className="navbar-logo">
          <span className="navbar-logo-icon">⊕</span>
          <span className="navbar-logo-text text-gradient">Orbit Station</span>
        </span>
        <Link href="/login" className="btn btn-secondary btn-sm">
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          <span>Your Personal Bookmark Universe</span>
        </div>

        <h1 className="landing-title">
          <span className="text-gradient">Organize the Web.</span>
          <br />
          Navigate Your Stars.
        </h1>

        <p className="landing-subtitle">
          Orbit Station is your personal portal — save web shortcuts into Sectors,
          share your collection publicly, and revisit what matters with one click.
        </p>

        <div className="landing-cta">
          <Link href="/login" className="btn btn-primary btn-lg landing-cta-main">
            Launch Your Station <ArrowRightIcon width={20} height={20} />
          </Link>
          <p className="landing-cta-hint">Free. No credit card required.</p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="landing-feature glass">
            <span className="landing-feature-icon"><DynamicIcon name={f.icon} width={28} height={28} /></span>
            <h3 className="landing-feature-title">{f.title}</h3>
            <p className="landing-feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="text-gradient" style={{ fontWeight: 700 }}>⊕ Orbit Station</span>
        <span style={{ color: "var(--color-nebula)", fontSize: "0.8125rem" }}>
          Built for curious minds.
        </span>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: "RocketLaunchIcon",
    title: "Sectors",
    desc: "Organize bookmarks into themed Sectors — Dev Tools, Entertainment, Research, anything.",
  },
  {
    icon: "SparklesIcon",
    title: "Smart Beacons",
    desc: "Auto-fetch OG images, titles, and descriptions when you paste a URL.",
  },
  {
    icon: "GlobeAltIcon",
    title: "Public Profile",
    desc: "Share your Station publicly. Let others explore your curated collection.",
  },
  {
    icon: "StarIcon",
    title: "Visit Tracking",
    desc: "Track how often you visit each beacon. Your most-used shortcuts earn more stars.",
  },
];
