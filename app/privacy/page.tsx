import React from "react";
import Link from "next/link";
import { ArrowLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Privacy Policy — Orbit Station",
  description: "Privacy Policy for Orbit Station",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-[#0F0F13] text-slate-300 py-12 px-4 sm:px-6 overflow-hidden">
      {/* Cosmic Background */}
      <div className="cosmic-bg fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
        <div className="cosmic-dust"></div>
      </div>

      <div className="relative z-10" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem", marginBottom: "4rem" }}>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all hover:-translate-x-1 font-medium bg-purple-500/10 rounded-full border border-purple-500/20 backdrop-blur-sm w-fit"
          style={{ padding: "0.5rem 1rem", marginTop: "3rem", marginBottom: "2rem" }}
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Base
        </Link>

        <div 
          className="glass rounded-3xl"
          style={{ 
            background: "linear-gradient(145deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.9) 100%)", 
            border: "1px solid rgba(255,255,255,0.08)", 
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.1)",
            padding: "3rem"
          }}
        >
          <div className="flex items-center border-b border-white/10" style={{ gap: "1rem", paddingBottom: "2rem", marginBottom: "2rem" }}>
            <div className="rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.3)]" style={{ padding: "1rem" }}>
              <ShieldCheckIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)", marginBottom: "0.5rem" }}>Privacy Policy</h1>
              <p className="text-purple-300/80 font-medium tracking-wide">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="text-lg leading-relaxed text-slate-300/90 font-light" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                1. Introduction
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                Welcome to Orbit Station ("we", "our", "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                2. Data We Collect
              </h2>
              <p style={{ paddingLeft: "2.5rem", marginBottom: "1rem" }}>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul style={{ paddingLeft: "4rem", display: "flex", flexDirection: "column", gap: "0.75rem", listStyleType: "disc" }} className="marker:text-purple-500">
                <li><strong className="text-white font-medium">Identity Data:</strong> includes username, first name, last name, or similar identifier.</li>
                <li><strong className="text-white font-medium">Contact Data:</strong> includes email address.</li>
                <li><strong className="text-white font-medium">Content Data:</strong> includes the bookmarks (beacons), categories (sectors), and notes you create on the platform.</li>
                <li><strong className="text-white font-medium">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                3. How We Use Your Data
              </h2>
              <p style={{ paddingLeft: "2.5rem", marginBottom: "1rem" }}>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul style={{ paddingLeft: "4rem", display: "flex", flexDirection: "column", gap: "0.75rem", listStyleType: "disc" }} className="marker:text-purple-500">
                <li>To register you as a new user.</li>
                <li>To provide and maintain our service, including allowing you to save and share web bookmarks.</li>
                <li>To manage our relationship with you.</li>
                <li>To administer and protect our business and this website.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                4. Data Security
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                5. Third-Party Links
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                Our service allows you to save and categorize links to third-party websites (beacons). Clicking on those links may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                6. Contact Us
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                If you have any questions about this privacy policy or our privacy practices, please contact us.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
