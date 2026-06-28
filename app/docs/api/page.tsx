"use client";

import { motion } from "framer-motion";
import { ArrowLeftIcon, CodeBracketIcon, ServerStackIcon, GlobeAltIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// --- Syntax Highlighted JSON Component ---
type Token = { type: "key" | "string" | "number" | "bool" | "null" | "comment" | "plain"; text: string };

function JsonLine({ tokens }: { tokens: Token[] }) {
  const colorMap: Record<Token["type"], string> = {
    key:     "#7dd3fc",  // sky-300  – keys
    string:  "#86efac",  // green-300 – string values
    number:  "#fda4af",  // rose-300 – numbers
    bool:    "#c4b5fd",  // violet-300 – booleans
    null:    "#94a3b8",  // slate-400 – null
    comment: "#4b5563",  // gray-600 – comments
    plain:   "#f1f5f9",  // slate-100 – brackets / punctuation
  };
  return (
    <span style={{ display: "block" }}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: colorMap[t.type] }}>{t.text}</span>
      ))}
    </span>
  );
}

// Pre-tokenised response examples
const ProfileResponse: Token[][] = [
  [{ type: "plain", text: "{" }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"success"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"data"' }, { type: "plain", text: ": {" }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"id"' }, { type: "plain", text: ": " }, { type: "string", text: '"cmazx7r3x5000ugqd0000sa0f"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"name"' }, { type: "plain", text: ": " }, { type: "string", text: '"Nova Stellaris"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"username"' }, { type: "plain", text: ": " }, { type: "string", text: '"nova_orb"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"email"' }, { type: "plain", text: ": " }, { type: "string", text: '"nova@example.com"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"bio"' }, { type: "plain", text: ": " }, { type: "string", text: '"Drifting through the digital cosmos."' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"hologramEnabled"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }],
  [{ type: "plain", text: "  }" }],
  [{ type: "plain", text: "}" }],
];

const StationResponse: Token[][] = [
  [{ type: "plain", text: "{" }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"success"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"data"' }, { type: "plain", text: ": {" }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"id"' }, { type: "plain", text: ": " }, { type: "string", text: '"station_nova_001"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"isPublic"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"sectors"' }, { type: "plain", text: ": [" }],
  [{ type: "plain", text: "      {" }],
  [{ type: "plain", text: "        " }, { type: "key", text: '"name"' }, { type: "plain", text: ": " }, { type: "string", text: '"Dev Tools"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "        " }, { type: "key", text: '"isPublic"' }, { type: "plain", text: ": " }, { type: "bool", text: "false" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "        " }, { type: "key", text: '"beacons"' }, { type: "plain", text: ": [" }],
  [{ type: "plain", text: "          {" }],
  [{ type: "plain", text: "            " }, { type: "key", text: '"title"' }, { type: "plain", text: ": " }, { type: "string", text: '"GitHub"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "            " }, { type: "key", text: '"url"' }, { type: "plain", text: ": " }, { type: "string", text: '"https://github.com/nova-orb"' }],
  [{ type: "plain", text: "          }" }],
  [{ type: "plain", text: "        ]" }],
  [{ type: "plain", text: "      }" }],
  [{ type: "plain", text: "    ]" }],
  [{ type: "plain", text: "  }" }],
  [{ type: "plain", text: "}" }],
];

const PublicResponse: Token[][] = [
  [{ type: "comment", text: "// GET /api/v1/users/nova_orb" }],
  [{ type: "plain", text: "{" }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"success"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "  " }, { type: "key", text: '"data"' }, { type: "plain", text: ": {" }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"username"' }, { type: "plain", text: ": " }, { type: "string", text: '"nova_orb"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"name"' }, { type: "plain", text: ": " }, { type: "string", text: '"Nova Stellaris"' }, { type: "plain", text: "," }],
  [{ type: "plain", text: "    " }, { type: "key", text: '"station"' }, { type: "plain", text: ": {" }],
  [{ type: "plain", text: "      " }, { type: "key", text: '"isPublic"' }, { type: "plain", text: ": " }, { type: "bool", text: "true" }, { type: "plain", text: "," }],
  [{ type: "plain", text: "      " }, { type: "key", text: '"sectors"' }, { type: "plain", text: ": [" }],
  [{ type: "comment", text: "        // Only sectors with isPublic: true appear here" }],
  [{ type: "plain", text: "      ]" }],
  [{ type: "plain", text: "    }" }],
  [{ type: "plain", text: "  }" }],
  [{ type: "plain", text: "}" }],
];

function CodeBlock({ lines }: { lines: Token[][] }) {
  return (
    <div style={{
      background: "rgba(0, 0, 0, 0.5)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      overflowX: "auto",
      marginTop: "1.25rem",
    }}>
      <pre style={{ margin: 0, fontSize: "0.8125rem", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.75 }}>
        {lines.map((line, i) => <JsonLine key={i} tokens={line} />)}
      </pre>
    </div>
  );
}

function SectionCard({ children, accentColor }: { children: React.ReactNode; accentColor: string }) {
  return (
    <motion.section
      variants={itemVariants}
      style={{
        background: "rgba(12, 12, 22, 0.7)",
        backdropFilter: "blur(24px)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderTop: `2px solid ${accentColor}`,
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: `0 20px 40px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {children}
    </motion.section>
  );
}

export default function ApiDocsPage() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden", color: "#f8fafc" }}>
      {/* Cosmic Background */}
      <div className="cosmic-bg" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.5 }}></div>
        <div className="cosmic-comet"></div>
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: "860px", margin: "0 auto", padding: "3rem 2rem 5rem" }}>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "2.5rem" }}
        >
          <Link
            href="/settings"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#a78bfa", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", transition: "color 0.2s" }}
          >
            <ArrowLeftIcon style={{ width: "16px", height: "16px" }} /> Back to Settings
          </Link>
        </motion.div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{ marginBottom: "3.5rem" }}
        >
          <h1 style={{
            fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #f0f4ff 30%, #a78bfa 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
          }}>
            Orbit Station API
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: "560px", margin: 0, lineHeight: 1.7 }}>
            Programmatic access to your digital universe. Build custom integrations,
            mobile apps, or fetch data for your own portfolio.
          </p>
        </motion.div>

        {/* Sections */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Authentication */}
          <SectionCard accentColor="#a78bfa">
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.625rem", borderRadius: "10px", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", flexShrink: 0 }}>
                <LockClosedIcon style={{ width: "20px", height: "20px" }} />
              </div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, color: "#f0f4ff" }}>Authentication</h2>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: "0 0 1rem" }}>
              All private endpoints (like{" "}
              <code style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.12)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.85em" }}>/me</code>
              ) require authentication. Include your Personal Access Token in the{" "}
              <code style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.12)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.85em" }}>Authorization</code>
              {" "}header of every request.
            </p>
            <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.25rem", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontSize: "0.875rem", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.6 }}>
                <span style={{ color: "#7dd3fc" }}>Authorization</span>
                <span style={{ color: "#f1f5f9" }}>: </span>
                <span style={{ color: "#86efac" }}>Bearer </span>
                <span style={{ color: "#fda4af" }}>YOUR_PERSONAL_ACCESS_TOKEN</span>
              </pre>
            </div>
          </SectionCard>

          {/* GET /api/v1/users/me */}
          <SectionCard accentColor="#22d3ee">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.625rem", borderRadius: "10px", background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee", flexShrink: 0, marginTop: "2px" }}>
                <ServerStackIcon style={{ width: "20px", height: "20px" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0f4ff" }}>Get Current Profile</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "3px 10px", borderRadius: "6px", fontWeight: 700, fontSize: "0.75rem", border: "1px solid rgba(34,197,94,0.3)", letterSpacing: "0.05em" }}>GET</span>
                  <code style={{ fontSize: "0.875rem", color: "#cbd5e1", fontFamily: "monospace" }}>/api/v1/users/me</code>
                  <span style={{ background: "rgba(167,139,250,0.15)", color: "#c4b5fd", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", border: "1px solid rgba(167,139,250,0.25)" }}>🔒 Auth Required</span>
                </div>
              </div>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              Retrieves the complete profile data of the authenticated user,
              including private preferences (bio, callsign, animation settings).
            </p>
            <CodeBlock lines={ProfileResponse} />
          </SectionCard>

          {/* GET /api/v1/users/me/station */}
          <SectionCard accentColor="#f472b6">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.625rem", borderRadius: "10px", background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.25)", color: "#f472b6", flexShrink: 0, marginTop: "2px" }}>
                <ServerStackIcon style={{ width: "20px", height: "20px" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0f4ff" }}>Get Station &amp; Sectors</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "3px 10px", borderRadius: "6px", fontWeight: 700, fontSize: "0.75rem", border: "1px solid rgba(34,197,94,0.3)", letterSpacing: "0.05em" }}>GET</span>
                  <code style={{ fontSize: "0.875rem", color: "#cbd5e1", fontFamily: "monospace" }}>/api/v1/users/me/station</code>
                  <span style={{ background: "rgba(167,139,250,0.15)", color: "#c4b5fd", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", border: "1px solid rgba(167,139,250,0.25)" }}>🔒 Auth Required</span>
                </div>
              </div>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              Retrieves your entire station hierarchy — all Sectors (public and private) and
              all Beacons (links) within them.
            </p>
            <CodeBlock lines={StationResponse} />
          </SectionCard>

          {/* GET /api/v1/users/[username] */}
          <SectionCard accentColor="#fbbf24">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.625rem", borderRadius: "10px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", flexShrink: 0, marginTop: "2px" }}>
                <GlobeAltIcon style={{ width: "20px", height: "20px" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f0f4ff" }}>Public Profile</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "3px 10px", borderRadius: "6px", fontWeight: 700, fontSize: "0.75rem", border: "1px solid rgba(34,197,94,0.3)", letterSpacing: "0.05em" }}>GET</span>
                  <code style={{ fontSize: "0.875rem", color: "#cbd5e1", fontFamily: "monospace" }}>/api/v1/users/&#123;username&#125;</code>
                  <span style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", border: "1px solid rgba(34,197,94,0.25)" }}>🌐 Public</span>
                </div>
              </div>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              Retrieves the public profile and public station data of any user by their username.
              No authentication needed. Private sectors and sensitive fields (email, password) are automatically stripped.
            </p>
            <CodeBlock lines={PublicResponse} />
          </SectionCard>

        </motion.div>
      </div>
    </main>
  );
}
