export default function StaticStarfield({ seed = 42, sectorColor }: { seed?: number; sectorColor?: string | null }) {
  const stars = Array.from({ length: 80 }).map((_, i) => {
    // Deterministic random based on seed and index
    const rng = (n: number) => (Math.sin(seed * 9301 + n * 49297) + 1) / 2;
    return {
      left: `${rng(i * 1.1) * 100}%`,
      top: `${rng(i * 2.3) * 100}%`,
      delay: `${rng(i * 3.7) * 4}s`,
      size: `${rng(i * 4.1) * 2 + 1}px`,
      opacity: rng(i * 5.1) * 0.5 + 0.3
    };
  });
  
  let bgStyle = {};
  if (sectorColor) {
    bgStyle = {
      background: `radial-gradient(circle at 50% 30%, ${sectorColor}20 0%, transparent 60%)`,
      position: "absolute",
      inset: 0,
      zIndex: -1
    };
  }

  return (
    <div className="starfield" aria-hidden="true" style={{ background: "linear-gradient(135deg, #050510 0%, #0a0820 50%, #050510 100%)" }}>
      {sectorColor && <div style={bgStyle as any} />}
      {stars.map((s, i) => (
        <div key={i} className="star" style={{
          left: s.left,
          top: s.top,
          animationDelay: s.delay,
          width: s.size,
          height: s.size,
          opacity: s.opacity,
          boxShadow: `0 0 ${s.size} #fff`
        }} />
      ))}
    </div>
  );
}
