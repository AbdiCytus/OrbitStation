"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({ content, children, position = "top", delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  };

  const handleMouseEnter = () => {
    updateCoords();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const child = React.cloneElement(children as any, {
    ref: triggerRef,
    onMouseEnter: (e: any) => {
      (children as any).props.onMouseEnter?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: any) => {
      (children as any).props.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onFocus: (e: any) => {
      (children as any).props.onFocus?.(e);
      handleMouseEnter();
    },
    onBlur: (e: any) => {
      (children as any).props.onBlur?.(e);
      handleMouseLeave();
    },
  });

  return (
    <>
      {child}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <div
                className="fixed z-[99999] pointer-events-none"
                style={{
                  left:
                    position === "top" || position === "bottom"
                      ? coords.x + coords.width / 2
                      : position === "left"
                      ? coords.x
                      : coords.x + coords.width,
                  top:
                    position === "left" || position === "right"
                      ? coords.y + coords.height / 2
                      : position === "top"
                      ? coords.y
                      : coords.y + coords.height,
                  transform:
                    position === "top"
                      ? "translate(-50%, -100%) translateY(-8px)"
                      : position === "bottom"
                      ? "translate(-50%, 0) translateY(8px)"
                      : position === "left"
                      ? "translate(-100%, -50%) translateX(-8px)"
                      : "translate(0, -50%) translateX(8px)",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[rgba(20,20,35,0.95)] backdrop-blur-md border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap shadow-lg px-3 py-2"
                >
                  {content}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
