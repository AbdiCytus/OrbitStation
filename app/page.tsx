export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
          Orbit Station
        </h1>
        <p style={{ color: "var(--color-comet)", fontSize: "1.1rem" }}>
          Your personal web portal in the stars.
        </p>
      </div>

      <div className="glass" style={{ padding: "1rem 2rem" }}>
        <span className="badge badge-violet">🚧 Milestone 1 — Foundation Complete</span>
      </div>

      <a href="/login" className="btn btn-primary btn-lg">
        Launch Station →
      </a>
    </main>
  );
}
