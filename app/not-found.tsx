import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      color: "#fff",
      fontFamily: "var(--font-inter)",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div className="not-found-card" style={{
        background: "rgba(20, 20, 35, 0.65)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        borderRadius: "24px",
        padding: "3rem",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(139, 92, 246, 0.1)"
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
        
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", background: "linear-gradient(135deg, #fff 0%, #a1a1aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Sector Not Found
        </h1>
        
        <p style={{ color: "#a1a1aa", fontSize: "1rem", lineHeight: "1.6", marginBottom: "2rem" }}>
          The coordinates you entered don't match any known sectors in the OrbStation database. 
          The page may have been moved or deleted.
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
