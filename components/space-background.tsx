"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number; y: number; z: number;
  size: number; opacity: number;
  speed: number; twinkleSpeed: number; twinklePhase: number;
};

type ShootingStar = {
  x: number; y: number;
  length: number; speed: number; angle: number; opacity: number; active: boolean;
};

type Nebula = {
  x: number; y: number;
  r: number; color: string; alpha: number;
};

type Asteroid = {
  x: number; y: number;
  size: number; speed: number; angle: number; rot: number; rotSpeed: number;
};

type Dust = {
  x: number; y: number; speedX: number; speedY: number; opacity: number;
  size: number; wobblePhase: number;
};

type Constellation = {
  stars: { x: number; y: number; size: number; twinklePhase: number }[];
  connections: [number, number][];
};

type Props = {
  sector?: string;
  variant?: "station" | "settings";
  sectorColor?: string | null;
  animEnabled?: boolean;
  transitionDuration?: number;
};

export default function SpaceBackground({ sector, sectorColor, variant = "station", animEnabled = true, transitionDuration = 800 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const nextNebulasRef = useRef<Nebula[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const dustRef = useRef<Dust[]>([]);
  const constellationRef = useRef<Constellation | null>(null);
  const nextConstellationRef = useRef<Constellation | null>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const prevSectorRef = useRef<string | undefined>(sector);
  const warpFactorRef = useRef<number>(80); // Start with high warp on mount
  const transitionRef = useRef<number>(2); // 0=idle, 1=out, 2=in
  const animEnabledRef = useRef(animEnabled);
  const transitionAlphaRef = useRef<number>(0);
  const sectorColorRef = useRef<string | null | undefined>(sectorColor);
  const currentSectorRef = useRef<string | undefined>(sector);
  const transitionDurationRef = useRef<number>(transitionDuration);

  useEffect(() => {
    transitionDurationRef.current = transitionDuration;
  }, [transitionDuration]);

  useEffect(() => {
    animEnabledRef.current = animEnabled;
  }, [animEnabled]);

  const generateConstellation = (seed: number): Constellation | null => {
    if (variant === "settings") return null;
    const rng = (n: number) => (Math.sin(seed * 9301 + n * 49297) + 1) / 2;
    const numStars = Math.floor(rng(1) * 5) + 5; // 5 to 9 stars
    const stars = [];
    const centerX = rng(2) * 0.6 + 0.2;
    const centerY = rng(3) * 0.4 + 0.2;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: centerX + (rng(i * 10) - 0.5) * 0.6,
        y: centerY + (rng(i * 10 + 1) - 0.5) * 0.6,
        size: rng(i * 10 + 2) * 1.5 + 0.8,
        twinklePhase: rng(i * 10 + 3) * Math.PI * 2,
      });
    }
    const connections: [number, number][] = [];
    for (let i = 1; i < numStars; i++) {
      connections.push([i, Math.floor(rng(i * 10 + 4) * i)]);
    }
    for (let i = 0; i < 2; i++) {
      const a = Math.floor(rng(i * 10 + 5) * numStars);
      const b = Math.floor(rng(i * 10 + 6) * numStars);
      if (a !== b) connections.push([a, b]);
    }
    return { stars, connections };
  };

  useEffect(() => {
    sectorColorRef.current = sectorColor;
    currentSectorRef.current = sector;
  }, [sectorColor, sector]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let prngSeed = sector ? sector.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
    function random() {
      prngSeed = (prngSeed * 9301 + 49297) % 233280;
      return prngSeed / 233280;
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Generate stars
    function generateStars(count: number): Star[] {
      return Array.from({ length: count }, () => ({
        x: random() * 2 - 1,
        y: random() * 2 - 1,
        z: random() * 1000 + 100,
        size: random() * 1.5 + 0.5,
        opacity: random() * 0.7 + 0.3,
        speed: random() * 0.5 + 0.1,
        twinkleSpeed: random() * 0.02 + 0.008,
        twinklePhase: random() * Math.PI * 2,
      }));
    }

    function initShootingStar(): ShootingStar {
      return {
        x: random() * window.innerWidth * 2,
        y: -100,
        length: random() * 80 + 30,
        speed: random() * 10 + 15,
        angle: Math.PI / 4 + (random() * 0.2 - 0.1),
        opacity: 0,
        active: false,
      };
    }
    shootingStarsRef.current = Array.from({ length: 3 }, initShootingStar);

    function initAsteroids(): Asteroid[] {
      return Array.from({ length: 4 }, () => ({
        x: random() * window.innerWidth,
        y: random() * window.innerHeight,
        size: random() * 3 + 1,
        speed: random() * 0.2 + 0.1,
        angle: random() * Math.PI * 2,
        rot: random() * Math.PI * 2,
        rotSpeed: (random() - 0.5) * 0.05,
      }));
    }
    asteroidsRef.current = initAsteroids();

    function initDust(): Dust[] {
      return Array.from({ length: 120 }, () => ({
        x: random(),
        y: random(),
        speedX: (random() - 0.5) * 0.0002,
        speedY: (random() - 0.5) * 0.0002,
        opacity: random() * 0.6 + 0.2,
        size: random() * 2.5 + 1,
        wobblePhase: random() * Math.PI * 2,
      }));
    }
    dustRef.current = initDust();

    // Generate nebula blobs for current sector
    function generateNebulas(seed: number, customColor?: string | null): Nebula[] {
      let baseColor = "rgba(124,92,252,";
      if (customColor) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(customColor);
        if (result) {
          baseColor = `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},`;
        }
      }
      const colors = [
        baseColor, "rgba(6,182,212,", "rgba(236,72,153,",
        "rgba(59,130,246,", "rgba(167,139,250,",
      ];
      const rng = (n: number) => (Math.sin(seed * 9301 + n * 49297) + 1) / 2;
      return Array.from({ length: 5 }, (_, i) => ({
        x: rng(i * 7),
        y: rng(i * 13),
        r: rng(i * 3) * 0.4 + 0.2,
        color: colors[i % colors.length],
        alpha: rng(i * 5) * 0.15 + 0.05,
      }));
    }

    const sectorSeed = sector ? sector.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
    starsRef.current = generateStars(400);
    nebulasRef.current = generateNebulas(sectorSeed, sectorColor);
    nextNebulasRef.current = nebulasRef.current;
    constellationRef.current = generateConstellation(sectorSeed);
    nextConstellationRef.current = constellationRef.current;

    function draw(timestamp: number) {
      if (!animEnabledRef.current) timestamp = 0; // Lock timestamp for identical renders when static
      
      if (!canvas || !ctx) return;
      const dt = timestamp - timeRef.current;
      timeRef.current = timestamp;
      const W = canvas.width;
      const H = canvas.height;

      let sr = 255, sg = 255, sb = 255;
      let rawR = 124, rawG = 92, rawB = 252;
      if (sectorColorRef.current) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(sectorColorRef.current);
        if (result) {
          rawR = parseInt(result[1], 16);
          rawG = parseInt(result[2], 16);
          rawB = parseInt(result[3], 16);
          sr = Math.floor((255 + rawR * 2) / 3);
          sg = Math.floor((255 + rawG * 2) / 3);
          sb = Math.floor((255 + rawB * 2) / 3);
        }
      }

      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, W * 0.8);
      if (variant === "settings") {
        bg.addColorStop(0, "#080b14");
        bg.addColorStop(0.5, "#03050a");
        bg.addColorStop(1, "#000002");
      } else {
        bg.addColorStop(0, "#0a0820");
        bg.addColorStop(0.5, "#050510");
        bg.addColorStop(1, "#020208");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Draw Aurora (Settings variant uses more cyan/green, Station uses purple/pink)
      const auroraTime = timestamp * 0.0002;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, H * 0.8);
        for (let x = 0; x <= W; x += 50) {
          const y = H * 0.4 + Math.sin(x * 0.003 + auroraTime + i) * 100 + Math.sin(x * 0.001 - auroraTime) * 50;
          ctx.lineTo(x, y + i * 30);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        const auroraGrad = ctx.createLinearGradient(0, 0, 0, H);
        if (variant === "settings") {
          auroraGrad.addColorStop(0, `rgba(6, 182, 212, ${0.03 - i * 0.01})`);
          auroraGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
        } else {
          auroraGrad.addColorStop(0, `rgba(${rawR}, ${rawG}, ${rawB}, ${0.05 - i * 0.01})`);
          auroraGrad.addColorStop(1, `rgba(${rawR}, ${rawG}, ${rawB}, 0)`);
        }
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      }
      ctx.restore();

      // Large glowing star/sun for station dashboard
      if (variant === "station") {
        ctx.save();
        const sx = W * 0.85 + Math.sin(timestamp * 0.0001) * 20;
        const sy = H * 0.15 + Math.cos(timestamp * 0.0001) * 20;
        
        const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.3);
        sunGrad.addColorStop(0, `rgba(${rawR}, ${rawG}, ${rawB}, 0.25)`);
        sunGrad.addColorStop(0.3, `rgba(${Math.floor(rawR * 0.5)}, ${Math.floor(rawG * 0.5)}, ${Math.floor(rawB * 0.5)}, 0.08)`);
        sunGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = sunGrad;
        ctx.beginPath(); ctx.arc(sx, sy, W * 0.3, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = "rgba(255, 230, 255, 0.95)";
        ctx.shadowColor = `rgba(${rawR}, ${rawG}, ${rawB}, 1)`;
        ctx.shadowBlur = 50;
        ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Sector transition & Warp mechanics
      const fadeSpeed = 1 / (transitionDurationRef.current / 2);
      if (transitionRef.current === 1) {
        warpFactorRef.current = Math.min(60, warpFactorRef.current + dt * (fadeSpeed * 40));
        transitionAlphaRef.current = Math.max(0, transitionAlphaRef.current - dt * fadeSpeed);
        if (transitionAlphaRef.current <= 0 && warpFactorRef.current > 40) {
          transitionRef.current = 2;
          nebulasRef.current = nextNebulasRef.current;
          constellationRef.current = nextConstellationRef.current;
        }
      } else if (transitionRef.current === 2) {
        warpFactorRef.current = Math.max(1, warpFactorRef.current - dt * (fadeSpeed * 25));
        transitionAlphaRef.current = Math.min(1, transitionAlphaRef.current + dt * fadeSpeed);
        if (transitionAlphaRef.current >= 1 && warpFactorRef.current <= 1.1) {
          transitionRef.current = 0;
          warpFactorRef.current = 1;
        }
      }

      const nebulaAlpha = transitionAlphaRef.current;
      const warp = warpFactorRef.current;

      // Draw nebulas
      nebulasRef.current.forEach((n) => {
        const grad = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * W);
        grad.addColorStop(0, n.color + (n.alpha * nebulaAlpha).toFixed(3) + ")");
        grad.addColorStop(1, n.color + "0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r * W, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw stars with warp effect
      const t = timestamp * 0.001;
      const cx = W / 2;
      const cy = H / 2;
      
      starsRef.current.forEach((star) => {
        star.z -= star.speed * warp * 2;
        if (star.z <= 0) {
          star.x = random() * 2 - 1;
          star.y = random() * 2 - 1;
          star.z = 1000;
        }

        const k = 128.0 / star.z;
        const px = star.x * k * W + cx;
        const py = star.y * k * H + cy;

        if (px >= 0 && px <= W && py >= 0 && py <= H) {
          const size = Math.max(0.1, star.size * k * 2);
          const twinkle = Math.sin(t * star.twinkleSpeed * 60 + star.twinklePhase);
          const alpha = star.opacity * (0.6 + twinkle * 0.4);
          
          if (warp > 2) {
            // Warp trail
            const pz = star.z + star.speed * warp * 2;
            const pk = 128.0 / pz;
            const ppx = star.x * pk * W + cx;
            const ppy = star.y * pk * H + cy;
            
            ctx.beginPath();
            ctx.moveTo(ppx, ppy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha.toFixed(2)})`;
            ctx.lineWidth = size;
            ctx.stroke();
          } else {
            // Normal star
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha.toFixed(2)})`;
            ctx.fill();
          }
        }
      });

      // Draw shooting stars (only when not in hyper-warp and animation is enabled)
      if (warp < 5 && animEnabledRef.current) {
        shootingStarsRef.current.forEach((ss) => {
          if (!ss.active) {
            if (random() < 0.005) {
              Object.assign(ss, initShootingStar());
              ss.active = true;
            }
          } else {
            ss.x -= Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.opacity += ss.opacity < 1 && ss.y < H / 2 ? 0.05 : -0.02;
            
            if (ss.opacity <= 0 || ss.x < 0 || ss.y > H) {
              ss.active = false;
            } else {
              const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x + Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
              grad.addColorStop(0, `rgba(255,255,255,${ss.opacity})`);
              grad.addColorStop(1, "rgba(255,255,255,0)");
              
              ctx.beginPath();
              ctx.moveTo(ss.x, ss.y);
              ctx.lineTo(ss.x + Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        });
      }

      // Draw constellation
      if (animEnabledRef.current && constellationRef.current && transitionAlphaRef.current > 0) {
        const c = constellationRef.current;
        const alphaMultiplier = transitionAlphaRef.current * Math.max(0, 1 - warp / 10);
        
        if (alphaMultiplier > 0.01) {
          const ct = timestamp * 0.002;
          
          ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${alphaMultiplier * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          c.connections.forEach(([i, j]) => {
            ctx.moveTo(c.stars[i].x * W, c.stars[i].y * H);
            ctx.lineTo(c.stars[j].x * W, c.stars[j].y * H);
          });
          ctx.stroke();

          c.stars.forEach(star => {
            const twinkle = Math.sin(ct + star.twinklePhase);
            const opacity = 0.4 + twinkle * 0.6;
            const px = star.x * W;
            const py = star.y * H;
            
            ctx.beginPath();
            ctx.arc(px, py, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * alphaMultiplier})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(px, py, star.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${opacity * alphaMultiplier * 0.3})`;
            ctx.fill();
          });
        }
      }

      // Draw dust
      if (animEnabledRef.current) {
        const dustT = timestamp * 0.001;
        dustRef.current.forEach((d) => {
          d.x = (d.x + d.speedX) % 1;
          if (d.x < 0) d.x += 1;
          d.y = (d.y + d.speedY) % 1;
          if (d.y < 0) d.y += 1;

          const wobbleX = Math.sin(dustT + d.wobblePhase) * 8;
          const wobbleY = Math.cos(dustT * 0.8 + d.wobblePhase) * 8;

          const px = d.x * W + wobbleX;
          const py = d.y * H + wobbleY;

          const baseAlpha = d.opacity * Math.min(1, 2 / warp);
          
          if (baseAlpha > 0) {
            ctx.beginPath();
            ctx.arc(px, py, d.size, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(px, py, 0, px, py, d.size);
            grad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${baseAlpha.toFixed(2)})`);
            grad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);
            ctx.fillStyle = grad;
            ctx.fill();
          }
        });
      }

      // Draw asteroids
      if (animEnabledRef.current) {
        asteroidsRef.current.forEach((ast) => {
        ast.x += Math.cos(ast.angle) * ast.speed;
        ast.y += Math.sin(ast.angle) * ast.speed;
        ast.rot += ast.rotSpeed;
        if (ast.x < -50) ast.x = W + 50;
        if (ast.x > W + 50) ast.x = -50;
        if (ast.y < -50) ast.y = H + 50;
        if (ast.y > H + 50) ast.y = -50;

        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rot);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const r = ast.size * (0.8 + Math.sin(i * 99) * 0.3); // irregular shape
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      }

      // Draw orbit rings in settings
      if (variant === "settings") {
        ctx.save();
        ctx.translate(W * 0.8, H * 0.2);
        ctx.rotate(t * 0.05);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 300, 100, Math.PI / 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 450, 150, -Math.PI / 8, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      if (animEnabledRef.current) {
        frameRef.current = requestAnimationFrame(draw);
      }
    }

    // Always draw at least one frame
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sector change — trigger constellation transition
  useEffect(() => {
    if (sector !== prevSectorRef.current) {
      prevSectorRef.current = sector;
      transitionRef.current = 1; // Trigger out transition and warp
      const sectorSeed = sector ? sector.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
      
      // Re-use the generation logic
      let baseColor = "rgba(124,92,252,";
      if (sectorColor) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(sectorColor);
        if (result) {
          baseColor = `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},`;
        }
      }
      const colors = [
        baseColor, "rgba(6,182,212,", "rgba(236,72,153,",
        "rgba(59,130,246,", "rgba(167,139,250,",
      ];
      const rng = (n: number) => (Math.sin(sectorSeed * 9301 + n * 49297) + 1) / 2;
      const newNebulas: Nebula[] = Array.from({ length: 5 }, (_, i) => ({
        x: rng(i * 7), y: rng(i * 13),
        r: rng(i * 3) * 0.4 + 0.2,
        color: colors[i % colors.length],
        alpha: rng(i * 5) * 0.15 + 0.05,
      }));
      // Will be swapped when alpha hits 0
      nextNebulasRef.current = newNebulas;
      nextConstellationRef.current = generateConstellation(sectorSeed);
    }
  }, [sector, sectorColor]);

  return (
    <canvas
      ref={canvasRef}
      className="space-canvas"
      aria-hidden="true"
    />
  );
}
