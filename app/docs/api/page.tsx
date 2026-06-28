"use client";

import { motion } from "framer-motion";
import { ArrowLeftIcon, CodeBracketIcon, ServerStackIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen relative overflow-hidden" style={{ color: "#f8fafc" }}>
      {/* Premium Cosmic Background (Same as Login Page) */}
      <div className="cosmic-bg fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.6, transform: "scale(1.2)" }}></div>
        <div className="cosmic-comet"></div>
        <div className="cosmic-dust"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/settings" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-6 font-medium">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.02em", textShadow: "0 0 20px rgba(139, 92, 246, 0.4)", margin: "0 0 1rem 0", lineHeight: 1.1 }}>
            Orbit Station API
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#94a3b8", maxWidth: "600px", margin: 0, lineHeight: 1.6 }}>
            Programmatic access to your digital universe. Use these endpoints to build custom integrations, mobile apps, or fetch data for your own portfolio.
          </p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">
          
          {/* Authentication Section */}
          <motion.section variants={itemVariants} className="glass rounded-3xl p-8 border border-white/10" style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <CodeBracketIcon className="w-6 h-6" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Authentication</h2>
            </div>
            <p style={{ color: "#cbd5e1", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              All private endpoints (like <code className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">/me</code>) require authentication. You must include your Personal Access Token in the Authorization header of your HTTP requests.
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-cyan-300">
                Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN
              </pre>
            </div>
          </motion.section>

          {/* Endpoint 1: Profile */}
          <motion.section variants={itemVariants} className="glass rounded-3xl p-8 border border-white/10" style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <ServerStackIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Get Current Profile</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded font-bold text-sm border border-green-500/30">GET</span>
                  <code className="text-sm text-slate-300">/api/v1/users/me</code>
                </div>
              </div>
            </div>
            <p style={{ color: "#cbd5e1", marginBottom: "1.5rem", lineHeight: 1.6, marginTop: "1rem" }}>
              Retrieves the complete profile data of the authenticated user, including private preferences (bio, callsign, animation settings).
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 overflow-x-auto">
              <pre className="text-sm font-mono" style={{ color: "#a78bfa" }}>
{`{
  "success": true,
  "data": {
    "id": "cmquq9ay40000ugqdsax7r3x5",
    "name": "Commander",
    "username": "kyura_89",
    "email": "user@example.com",
    "bio": "Exploring the digital cosmos.",
    "hologramEnabled": true,
    // ...
  }
}`}
              </pre>
            </div>
          </motion.section>

          {/* Endpoint 2: Station */}
          <motion.section variants={itemVariants} className="glass rounded-3xl p-8 border border-white/10" style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400">
                <ServerStackIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Get Station & Sectors</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded font-bold text-sm border border-green-500/30">GET</span>
                  <code className="text-sm text-slate-300">/api/v1/users/me/station</code>
                </div>
              </div>
            </div>
            <p style={{ color: "#cbd5e1", marginBottom: "1.5rem", lineHeight: 1.6, marginTop: "1rem" }}>
              Retrieves your entire station hierarchy. This includes all your Sectors (both public and private) and all the Beacons (links) within them, perfectly ordered.
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 overflow-x-auto">
              <pre className="text-sm font-mono" style={{ color: "#a78bfa" }}>
{`{
  "success": true,
  "data": {
    "id": "station_123",
    "isPublic": true,
    "sectors": [
      {
        "name": "My Workspace",
        "isPublic": false,
        "beacons": [
          {
            "title": "GitHub",
            "url": "https://github.com",
            // ...
          }
        ]
      }
    ]
  }
}`}
              </pre>
            </div>
          </motion.section>

          {/* Endpoint 3: Public Profile */}
          <motion.section variants={itemVariants} className="glass rounded-3xl p-8 border border-white/10" style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <GlobeAltIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Public Profile (No Auth)</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded font-bold text-sm border border-green-500/30">GET</span>
                  <code className="text-sm text-slate-300">/api/v1/users/[username]</code>
                </div>
              </div>
            </div>
            <p style={{ color: "#cbd5e1", marginBottom: "1.5rem", lineHeight: 1.6, marginTop: "1rem" }}>
              Retrieves the public profile and public station data of any user by their username. This endpoint does NOT require authentication. Private sectors and sensitive data (like email) are automatically stripped from the response.
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 overflow-x-auto">
              <pre className="text-sm font-mono" style={{ color: "#a78bfa" }}>
{`// GET /api/v1/users/kyura_89
{
  "success": true,
  "data": {
    "username": "kyura_89",
    "name": "Abdi Prayuda",
    "station": {
      "isPublic": true,
      "sectors": [
        // ONLY sectors with isPublic: true are returned here
      ]
    }
  }
}`}
              </pre>
            </div>
          </motion.section>

        </motion.div>
      </div>
    </main>
  );
}
