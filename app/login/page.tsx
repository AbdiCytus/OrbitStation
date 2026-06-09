export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        className="glass"
        style={{
          padding: "2.5rem",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            className="text-gradient"
            style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}
          >
            Orbit Station
          </h1>
          <p style={{ color: "var(--color-comet)", fontSize: "0.9rem" }}>
            Sign in to access your Station
          </p>
        </div>

        <hr className="divider" />

        {/* Auth buttons akan ditambahkan di Milestone berikutnya */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
            Continue with GitHub
          </button>
          <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>
            Continue with Google
          </button>
        </div>

        <span className="badge badge-violet" style={{ alignSelf: "center" }}>
          🚧 Auth coming in next milestone
        </span>
      </div>
    </main>
  );
}
