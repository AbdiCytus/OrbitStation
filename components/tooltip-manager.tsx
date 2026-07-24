"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function TooltipManager() {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; pos: "top" | "bottom" } | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tooltip]");
      if (target) {
        const text = target.getAttribute("data-tooltip");
        if (text) {
          const rect = target.getBoundingClientRect();
          let pos = "top";
          let y = rect.top - 8;
          
          // if it goes above screen (top boundary check)
          if (rect.top < 50) { 
            pos = "bottom";
            y = rect.bottom + 8;
          }

          // if it goes below screen (bottom boundary check)
          if (y + 40 > window.innerHeight) {
            pos = "top";
            y = rect.top - 8;
          }

          setTooltip({ text, x: rect.left + rect.width / 2, y, pos: pos as any });
        }
      }
    };
    
    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tooltip]");
      if (target) {
        setTooltip(null);
      }
    };
    
    // Also clear on scroll or click
    const handleClear = () => setTooltip(null);

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("click", handleClear);
    window.addEventListener("scroll", handleClear, { passive: true });
    
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleClear);
      window.removeEventListener("scroll", handleClear);
    }
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {tooltip && (
        <div
          className="fixed pointer-events-none z-[2147483647]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: tooltip.pos === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-[rgba(20,20,35,0.95)] backdrop-blur-md border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap shadow-lg"
            style={{ padding: "8px 12px" }}
          >
            {tooltip.text}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
