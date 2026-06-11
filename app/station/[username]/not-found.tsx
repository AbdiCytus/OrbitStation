import Link from "next/link";
import "./public-profile.css";

export default function NotFound() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Cosmic Background (Animation Enabled State) */}
      <div className="cosmic-bg">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora"></div>
        <div className="cosmic-blackhole">
          <div className="accretion-disk"></div>
        </div>
        <div className="cosmic-asteroids"></div>
        <div className="cosmic-comet"></div>
        <div className="cosmic-comet comet-2"></div>
        <div className="cosmic-dust"></div>
      </div>

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        <h1 style={{ 
          fontFamily: "'Space Grotesk', sans-serif", 
          fontSize: "4rem", 
          fontWeight: 800, 
          color: "#fff", 
          textShadow: "0 0 30px rgba(139, 92, 246, 0.8)",
          margin: 0,
          letterSpacing: "-0.02em"
        }}>
          Station Not Found
        </h1>
        <p style={{ color: "#c4b5fd", fontSize: "1.2rem" }}>
          The cosmic coordinates you requested do not exist.
        </p>
        <Link href="/station" style={{
          marginTop: "1rem",
          padding: "0.75rem 2rem",
          background: "rgba(139, 92, 246, 0.2)",
          border: "1px solid #a78bfa",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
          transition: "all 0.2s"
        }}>
          Return to Station
        </Link>
      </div>
    </div>
  );
}
