import React from "react";
import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Terms of Service — Orbit Station",
  description: "Terms of Service for Orbit Station",
};

export default function TermsPage() {
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
              <DocumentTextIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)", marginBottom: "0.5rem" }}>Terms of Service</h1>
              <p className="text-purple-300/80 font-medium tracking-wide">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="text-lg leading-relaxed text-slate-300/90 font-light" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                1. Acceptance of Terms
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                By accessing or using Orbit Station ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                2. Description of Service
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                Orbit Station is a platform that allows users to save, organize, and share web links (referred to as "Beacons") within categorized groups ("Sectors"). We provide this service on an "as is" and "as available" basis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                3. User Accounts
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                4. Content
              </h2>
              <p style={{ paddingLeft: "2.5rem", marginBottom: "1rem" }}>
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
              </p>
              <p style={{ paddingLeft: "2.5rem" }}>
                By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                5. Prohibited Activities
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                6. Termination
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-300 flex items-center gap-2" style={{ marginBottom: "1rem" }}>
                <span className="bg-purple-500/50 block" style={{ width: "2rem", height: "1px" }}></span>
                7. Changes to Terms
              </h2>
              <p style={{ paddingLeft: "2.5rem" }}>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
