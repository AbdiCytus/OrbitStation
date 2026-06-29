"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  animEnabled?: boolean;
  sector?: string;
  sectorColor?: string | null;
};

export default function LightBackground({ animEnabled = true, sector, sectorColor }: Props) {
  const [warpFlash, setWarpFlash] = useState(false);
  const prevSector = useRef(sector);

  useEffect(() => {
    if (sector !== prevSector.current) {
      prevSector.current = sector;
      if (animEnabled) {
        setWarpFlash(true);
        const t = setTimeout(() => setWarpFlash(false), 1200); // 1.2s warp duration
        return () => clearTimeout(t);
      }
    }
  }, [sector, animEnabled]);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#e2e8f0]">
      
      {/* Hyper-Warp Flash Overlay */}
      <motion.div
        className="fixed inset-0 z-50 bg-white pointer-events-none mix-blend-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: warpFlash ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Warp Tunnel Starburst Effect (Hyperspeed lines shooting outward) */}
      {warpFlash && (
        <div className="absolute inset-0 z-40 overflow-hidden">
          {/* Create 20 high-speed light streaks (optimized for performance) */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 bg-white origin-left rounded-full"
              style={{
                width: `${Math.random() * 300 + 100}px`,
                height: `${Math.random() * 4 + 2}px`,
                boxShadow: i % 2 === 0 
                  ? "0 0 20px 5px rgba(103,232,249,0.5)"  // Cyan glow
                  : "0 0 20px 5px rgba(167,139,250,0.5)", // Violet glow
                willChange: "transform, opacity"
              }}
              initial={{ 
                 rotate: Math.random() * 360,
                 x: Math.random() * 100, 
                 scaleX: 0,
                 opacity: 0
              }}
              animate={{ 
                 x: [Math.random() * 100, 2000], 
                 scaleX: [0, 3, 0],
                 opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                 duration: Math.random() * 0.4 + 0.3, 
                 ease: "easeIn",
                 delay: Math.random() * 0.2 
              }}
            />
          ))}
          {/* Central Warp Core Explosion (optimized using scale instead of width/height) */}
          <motion.div
            className="absolute top-1/2 left-1/2 bg-white rounded-full origin-center"
            style={{ 
              width: "5vw", 
              height: "5vw", 
              x: "-50%", 
              y: "-50%", 
              boxShadow: "0 0 80px 40px rgba(255,255,255,0.8)",
              willChange: "transform, opacity" 
            }}
            animate={{
              scale: [0, 30],
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      )}

      {/* 
        MAIN ROOM CONTAINER 
        OPTIMIZATION: Removed scale and filter animation to prevent framedrops. 
        Now only fades out during hyperspeed warp.
      */}
      <motion.div
        className="w-full h-full absolute inset-0 origin-center"
        animate={warpFlash ? {
          opacity: [1, 0.5, 0, 1]
        } : { opacity: 1 }}
        transition={{ duration: 1.2, times: [0, 0.4, 0.6, 1], ease: "easeInOut" }}
        style={{ willChange: "opacity" }}
      >
        {/* Deepest background with subtle brand gradients (Ruang terdalam) */}
        <div className="absolute inset-0 bg-[#f8fafc] overflow-hidden">
          {/* Soft violet/indigo glow */}
          <motion.div 
            className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-50"
            style={{ background: "#ede9fe", willChange: "transform, opacity" }}
            animate={animEnabled && !warpFlash ? {
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4]
            } : {}}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Soft cyan glow */}
          <motion.div 
            className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[130px] opacity-50"
            style={{ background: "#cffafe", willChange: "transform, opacity" }}
            animate={animEnabled && !warpFlash ? {
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3]
            } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          {/* Sector-specific accent color glow in the center */}
          <motion.div 
            className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] transition-colors duration-1000"
            style={{ background: sectorColor || "#fce7f3", willChange: "transform, opacity" }}
            animate={animEnabled && !warpFlash ? {
              scale: [1, 1.1, 1],
              x: [0, 30, 0]
            } : {}}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Ceiling curve (Langit-langit melengkung) */}
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[120vw] h-[50vh] bg-[#f8fafc]"
          style={{
            borderRadius: "0 0 60% 40% / 0 0 80% 90%",
            boxShadow: "inset 0 -40px 60px rgba(255,255,255,1), inset 0 20px 40px rgba(148,163,184,0.15), 0 50px 100px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            rotate: [0, 1, 0, -1, 0],
            scale: [1, 1.02, 1]
          } : {}}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute bottom-[8%] left-[30%] w-[30%] h-[15%] bg-white rounded-full blur-[25px] opacity-90 transform -rotate-6"></div>
          <div className="absolute bottom-[2%] left-[40%] w-[15%] h-[8%] bg-white rounded-full blur-[10px] opacity-100 transform -rotate-12"></div>
        </motion.div>

        {/* Floor curve (Lantai melengkung) */}
        <motion.div 
          className="absolute bottom-[-20%] left-[-10%] w-[120vw] h-[50vh] bg-[#f8fafc]"
          style={{
            borderRadius: "40% 60% 0 0 / 90% 80% 0 0",
            boxShadow: "inset 0 40px 60px rgba(255,255,255,1), inset 0 -20px 40px rgba(148,163,184,0.15), 0 -50px 100px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            rotate: [0, -1, 0, 1, 0],
            scale: [1, 1.02, 1]
          } : {}}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute top-[8%] right-[30%] w-[30%] h-[15%] bg-white rounded-full blur-[25px] opacity-90 transform rotate-6"></div>
          <div className="absolute top-[2%] right-[40%] w-[15%] h-[8%] bg-white rounded-full blur-[10px] opacity-100 transform rotate-12"></div>
        </motion.div>

        {/* Left Pillar/Wall (Dinding melengkung kiri) */}
        <motion.div 
          className="absolute top-[10%] left-[-15%] w-[40vw] h-[80vh] bg-[#f8fafc]"
          style={{
            borderRadius: "0 80% 60% 0 / 0 50% 50% 0",
            boxShadow: "inset -40px 0 60px rgba(255,255,255,1), inset 20px 0 40px rgba(148,163,184,0.15), 40px 0 100px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            rotate: [0, 2, 0, -2, 0]
          } : {}}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute top-[40%] right-[8%] w-[15%] h-[30%] bg-white rounded-full blur-[25px] opacity-90"></div>
        </motion.div>

        {/* Right Pillar/Wall (Dinding melengkung kanan) */}
        <motion.div 
          className="absolute top-[20%] right-[-10%] w-[35vw] h-[90vh] bg-[#f8fafc]"
          style={{
            borderRadius: "70% 0 0 50% / 40% 0 0 60%",
            boxShadow: "inset 40px 0 60px rgba(255,255,255,1), inset -20px 0 40px rgba(148,163,184,0.15), -40px 0 100px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            rotate: [0, -2, 0, 2, 0]
          } : {}}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute top-[30%] left-[8%] w-[20%] h-[25%] bg-white rounded-full blur-[25px] opacity-90"></div>
        </motion.div>

        {/* Extra floating fluid shape in the background for depth */}
        <motion.div 
          className="absolute top-[40%] left-[35%] w-[30vw] h-[40vh] bg-[#f8fafc]"
          style={{
            borderRadius: "40% 60% 50% 50% / 50% 40% 60% 50%",
            boxShadow: "inset 20px 20px 40px rgba(255,255,255,0.8), inset -20px -20px 40px rgba(148,163,184,0.1), 20px 30px 60px rgba(148,163,184,0.15)",
            zIndex: -1,
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            rotate: [0, 8, -8, 0],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        ></motion.div>

        {/* Floating 3D Objects (Benda mengambang) */}
        <motion.div
          className="absolute w-[6vw] h-[6vw] bg-[#f8fafc] rounded-full"
          style={{
            top: "25%",
            left: "20%",
            boxShadow: "inset -10px -10px 20px rgba(148,163,184,0.15), inset 10px 10px 20px rgba(255,255,255,1), 10px 20px 30px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            y: [0, -40, 0],
            x: [0, 20, 0],
            rotate: [0, 180, 360]
          } : {}}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[12vw] h-[5vw] bg-[#f8fafc]"
          style={{
            bottom: "15%",
            right: "25%",
            borderRadius: "50px",
            boxShadow: "inset -10px -10px 20px rgba(148,163,184,0.15), inset 15px 15px 20px rgba(255,255,255,1), 15px 30px 40px rgba(148,163,184,0.2)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            y: [0, 30, 0],
            rotate: [-10, 10, -10]
          } : {}}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[3vw] h-[3vw] bg-[#f8fafc] rounded-full"
          style={{
            top: "15%",
            right: "35%",
            boxShadow: "inset -5px -5px 10px rgba(148,163,184,0.2), inset 5px 5px 10px rgba(255,255,255,1), 5px 15px 20px rgba(148,163,184,0.15)",
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            y: [0, -20, 0],
            x: [0, -20, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <motion.div
          className="absolute w-[8vw] h-[8vw] bg-[#f8fafc]"
          style={{
            bottom: "40%",
            left: "15%",
            borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
            boxShadow: "inset -15px -15px 25px rgba(148,163,184,0.1), inset 15px 15px 25px rgba(255,255,255,1), 15px 25px 45px rgba(148,163,184,0.2)",
            zIndex: -2,
            willChange: "transform"
          }}
          animate={animEnabled && !warpFlash ? {
            y: [0, 50, 0],
            rotate: [0, -90, 0],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated Light Loops (The glowing energy reflecting on the walls) */}
        {animEnabled && !warpFlash && (
          <>
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
                x: ["0%", "10%", "0%"],
                y: ["0%", "-10%", "0%"]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-[25%] left-[20%] w-[40vw] h-[8vw] rounded-[100%] blur-[40px]"
              style={{ 
                background: "rgba(255, 255, 255, 1)", 
                boxShadow: "0 0 80px 40px rgba(255,255,255,0.9)",
                transform: "rotate(-15deg)",
                willChange: "transform, opacity"
              }}
            />

            <motion.div
              animate={{
                opacity: [0.3, 0.9, 0.3],
                scale: [1, 1.3, 1],
                x: ["0%", "-15%", "0%"],
                y: ["0%", "10%", "0%"]
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-[30%] right-[15%] w-[45vw] h-[10vw] rounded-[100%] blur-[50px]"
              style={{ 
                background: "rgba(255, 255, 255, 1)", 
                boxShadow: "0 0 100px 50px rgba(255,255,255,0.8)",
                transform: "rotate(20deg)",
                willChange: "transform, opacity"
              }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
