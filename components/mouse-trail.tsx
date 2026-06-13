"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MouseTrail() {
  const [isClient, setIsClient] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only enable on devices with a fine pointer (like a mouse)
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsClient(true);
    }
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150);
      mouseY.set(e.clientY - 150);
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [mouseX, mouseY]);

  if (!isClient) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50 mix-blend-screen"
      style={{
        x: smoothX,
        y: smoothY,
        width: 300,
        height: 300,
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)",
        borderRadius: "50%",
      }}
    />
  );
}
