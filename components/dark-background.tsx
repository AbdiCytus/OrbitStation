"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  animEnabled?: boolean;
  sector?: string;
  sectorColor?: string | null;
};

export default function DarkBackground({ animEnabled = true, sector, sectorColor }: Props) {
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
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#09090b]">
      
      {/* Dark Hyper-Warp Flash Overlay (Black hole swallow effect) */}
      <motion.div
        className="fixed inset-0 z-50 bg-[#050505] pointer-events-none mix-blend-normal"
        initial={{ opacity: 0 }}
        animate={{ opacity: warpFlash ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Dark Warp Tunnel Starburst Effect */}
      {warpFlash && (
        <div className="absolute inset-0 z-40 overflow-hidden">
          {/* Create 20 high-speed dark/neon streaks */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 bg-white origin-left rounded-full"
              style={{
                width: `${Math.random() * 300 + 100}px`,
                height: `${Math.random() * 3 + 1}px`,
                boxShadow: i % 2 === 0 
                  ? "0 0 20px 5px rgba(103,232,249,0.8)"  // Cyan glow
                  : "0 0 20px 5px rgba(167,139,250,0.8)", // Violet glow
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
                 scaleX: [0, 4, 0],
                 opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                 duration: Math.random() * 0.4 + 0.3, 
                 ease: "easeIn",
                 delay: Math.random() * 0.1 
              }}
            />
          ))}
          {/* Central Black Hole Core Explosion */}
          <motion.div
            className="absolute top-1/2 left-1/2 bg-black rounded-full origin-center"
            style={{ 
              width: "5vw", 
              height: "5vw", 
              x: "-50%", 
              y: "-50%", 
              boxShadow: "0 0 100px 50px rgba(0,0,0,1), inset 0 0 20px 10px rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.1)",
              willChange: "transform, opacity" 
            }}
            animate={{
              scale: [0, 40],
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 0.8, ease: "easeIn", delay: 0.1 }}
          />
        </div>
      )}

      {/* 
        MAIN ROOM CONTAINER 
        Fades out during the dark hyper-warp jump.
      */}
      <motion.div
        className="w-full h-full absolute inset-0 origin-center"
        animate={warpFlash ? {
          opacity: [1, 0, 0, 1]
        } : { opacity: 1 }}
        transition={{ duration: 1.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
        style={{ willChange: "opacity" }}
      >
        {/* Deepest background base (Matte Dark Gray) */}
        <div className="absolute inset-0 bg-[#0c0c0e] overflow-hidden">
          
          {/* Absurd Pattern Texture (Subtle animated noise/topography) */}
          <motion.div 
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
              backgroundRepeat: "repeat",
              willChange: "transform"
            }}
            animate={animEnabled ? {
              backgroundPosition: ["0px 0px", "200px 200px"]
            } : {}}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          />

          {/* Sector-specific accent color glow in the center */}
          <motion.div 
            className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full blur-[140px] opacity-[0.1] transition-colors duration-1000"
            style={{ background: sectorColor || "#ffffff", willChange: "transform, opacity" }}
            animate={animEnabled ? {
              scale: [1, 1.2, 1],
              x: [0, 20, 0]
            } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Ceiling curve (Langit-langit melengkung hitam doff) */}
        <motion.div 
          className="absolute top-[-25%] left-[-15%] w-[130vw] h-[55vh] bg-[#121214]"
          style={{
            borderRadius: "0 0 55% 45% / 0 0 75% 85%",
            boxShadow: "inset 0 -3px 8px rgba(255,255,255,0.15), inset 0 20px 50px rgba(0,0,0,0.9), 0 50px 100px rgba(0,0,0,0.95)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            rotate: [0, 1.5, 0, -1.5, 0]
          } : {}}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Specular Edge Highlights */}
          <div className="absolute bottom-[2%] left-[25%] w-[40%] h-[5%] bg-white rounded-full blur-[10px] opacity-[0.15] transform -rotate-3"></div>
          <div className="absolute bottom-[0%] left-[35%] w-[20%] h-[3%] bg-white rounded-full blur-[4px] opacity-[0.25] transform -rotate-6"></div>
        </motion.div>

        {/* Floor curve (Lantai melengkung hitam doff) */}
        <motion.div 
          className="absolute bottom-[-25%] left-[-10%] w-[125vw] h-[55vh] bg-[#0f0f12]"
          style={{
            borderRadius: "45% 55% 0 0 / 85% 75% 0 0",
            boxShadow: "inset 0 3px 8px rgba(255,255,255,0.15), inset 0 -20px 50px rgba(0,0,0,0.9), 0 -50px 100px rgba(0,0,0,0.95)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            rotate: [0, -1.5, 0, 1.5, 0]
          } : {}}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Specular Edge Highlights */}
          <div className="absolute top-[2%] right-[25%] w-[35%] h-[5%] bg-white rounded-full blur-[12px] opacity-[0.15] transform rotate-3"></div>
          <div className="absolute top-[0%] right-[35%] w-[15%] h-[3%] bg-white rounded-full blur-[4px] opacity-[0.25] transform rotate-6"></div>
        </motion.div>

        {/* Left Pillar/Wall (Dinding kiri) */}
        <motion.div 
          className="absolute top-[5%] left-[-20%] w-[45vw] h-[90vh] bg-[#141417]"
          style={{
            borderRadius: "0 85% 55% 0 / 0 45% 55% 0",
            boxShadow: "inset -3px 0 8px rgba(255,255,255,0.12), inset 20px 0 50px rgba(0,0,0,0.9), 50px 0 100px rgba(0,0,0,0.8)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            rotate: [0, 2, 0, -2, 0]
          } : {}}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Specular Edge Highlights */}
          <div className="absolute top-[35%] right-[2%] w-[5%] h-[30%] bg-white rounded-full blur-[8px] opacity-[0.2]"></div>
        </motion.div>

        {/* Right Pillar/Wall (Dinding kanan) */}
        <motion.div 
          className="absolute top-[10%] right-[-15%] w-[40vw] h-[100vh] bg-[#111114]"
          style={{
            borderRadius: "75% 0 0 45% / 35% 0 0 65%",
            boxShadow: "inset 3px 0 8px rgba(255,255,255,0.12), inset -20px 0 50px rgba(0,0,0,0.9), -50px 0 100px rgba(0,0,0,0.8)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            rotate: [0, -2, 0, 2, 0]
          } : {}}
          transition={{ duration: 29, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Specular Edge Highlights */}
          <div className="absolute top-[40%] left-[2%] w-[5%] h-[20%] bg-white rounded-full blur-[6px] opacity-[0.25]"></div>
        </motion.div>

        {/* Extra floating background depth layer */}
        <motion.div 
          className="absolute top-[35%] left-[30%] w-[40vw] h-[50vh] bg-[#0c0c0e]"
          style={{
            borderRadius: "45% 55% 50% 50% / 50% 45% 55% 50%",
            boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.1), inset -10px -10px 30px rgba(0,0,0,0.8), 20px 30px 60px rgba(0,0,0,0.9)",
            zIndex: -1,
            willChange: "transform"
          }}
          animate={animEnabled ? {
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        ></motion.div>

        {/* Floating 3D Objects (Benda mengambang elegan) */}
        <motion.div
          className="absolute w-[5vw] h-[5vw] bg-[#151518] rounded-full"
          style={{
            top: "20%",
            left: "25%",
            boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.9), inset 2px 2px 5px rgba(255,255,255,0.2), 10px 15px 25px rgba(0,0,0,0.8)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 180, 360]
          } : {}}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[10vw] h-[4vw] bg-[#141416]"
          style={{
            bottom: "20%",
            right: "20%",
            borderRadius: "50px",
            boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.9), inset 2px 2px 5px rgba(255,255,255,0.2), 15px 20px 30px rgba(0,0,0,0.8)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            y: [0, 25, 0],
            rotate: [-15, 15, -15]
          } : {}}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[2.5vw] h-[2.5vw] bg-[#18181b] rounded-full"
          style={{
            top: "25%",
            right: "30%",
            boxShadow: "inset -3px -3px 8px rgba(0,0,0,0.9), inset 1px 1px 3px rgba(255,255,255,0.25), 5px 10px 15px rgba(0,0,0,0.7)",
            willChange: "transform"
          }}
          animate={animEnabled ? {
            y: [0, -15, 0],
            x: [0, -15, 0]
          } : {}}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Animated Light Loops (The glowing energy reflecting on the dark walls) */}
        {animEnabled && (
          <>
            <motion.div
              animate={{
                opacity: [0.05, 0.15, 0.05],
                x: ["0%", "8%", "0%"],
                y: ["0%", "-8%", "0%"]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-[20%] left-[15%] w-[45vw] h-[10vw] rounded-[100%] blur-[60px] pointer-events-none"
              style={{ 
                background: "rgba(255, 255, 255, 1)", 
                transform: "rotate(-20deg)",
                willChange: "transform, opacity"
              }}
            />

            <motion.div
              animate={{
                opacity: [0.05, 0.12, 0.05],
                x: ["0%", "-10%", "0%"],
                y: ["0%", "10%", "0%"]
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-[25%] right-[10%] w-[50vw] h-[12vw] rounded-[100%] blur-[70px] pointer-events-none"
              style={{ 
                background: "rgba(255, 255, 255, 1)", 
                transform: "rotate(25deg)",
                willChange: "transform, opacity"
              }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
