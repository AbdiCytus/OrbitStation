"use client";

import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import "./public-profile.css";

type Props = {
  staticBackgroundEnabled: boolean;
  animationEnabled: boolean;
};

function CosmicBackground({ enabled, isMobile }: { enabled: boolean; isMobile: boolean }) {
  if (!enabled) {
    return (
      <div className="cosmic-bg">
        <div className="cosmic-stars"></div>
      </div>
    );
  }
  return (
    <div className="cosmic-bg">
      <div className="cosmic-stars"></div>
      <div className="cosmic-aurora"></div>
      <div className="cosmic-blackhole">
        <div className="accretion-disk"></div>
      </div>
      {!isMobile && <div className="cosmic-asteroids"></div>}
      <div className="cosmic-comet"></div>
      {!isMobile && <div className="cosmic-comet comet-2"></div>}
      {!isMobile && <div className="cosmic-dust"></div>}
    </div>
  );
}

export default function ProfileNotFoundClient({ staticBackgroundEnabled, animationEnabled }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="profile-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", color: "#fff", fontFamily: "var(--font-inter)", textAlign: "center", padding: "2rem" }}>
      {/* Background */}
      {staticBackgroundEnabled ? (
        <div className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg" aria-hidden="true">
          <div className="cosmic-stars"></div>
          <div className="cosmic-aurora" style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
          <div className="cosmic-dust"></div>
        </div>
      ) : (
        <CosmicBackground enabled={animationEnabled} isMobile={isMobile} />
      )}

      <div className="not-found-card" style={{
        background: "rgba(20, 20, 35, 0.65)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        borderRadius: "24px",
        padding: isMobile ? "2rem 1.5rem" : "3rem",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(139, 92, 246, 0.1)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "rgba(139, 92, 246, 0.1)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          border: "1px solid rgba(139, 92, 246, 0.2)"
        }}>
          <ExclamationTriangleIcon width={40} height={40} style={{ color: "#a78bfa" }} />
        </div>
        
        <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: "bold", marginBottom: "1rem", background: "linear-gradient(135deg, #fff 0%, #a1a1aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Station Not Found
        </h1>
        
        <p style={{ color: "#a1a1aa", fontSize: isMobile ? "0.9rem" : "1rem", lineHeight: "1.6", marginBottom: "2rem" }}>
          The pilot station you are looking for does not exist or has been removed from the OrbStation network.
        </p>
        
        <Link 
          href="/" 
          className="btn btn-primary"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: "600",
            textDecoration: "none",
            boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            transition: "all 0.2s"
          }}
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}
