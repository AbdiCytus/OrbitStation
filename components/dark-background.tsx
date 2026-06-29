"use client";

import { motion } from "framer-motion";

type Props = {
  animEnabled?: boolean;
  sector?: string;
  sectorColor?: string | null;
};

export default function DarkBackground({ animEnabled = true, sector, sectorColor }: Props) {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden" style={{ background: "radial-gradient(circle at 50% 10%, #18181b 0%, #09090b 100%)" }}>
      {/* Edge lighting */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      {/* Subtle absurd pattern using an SVG data URI */}
      <motion.div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34l-.83-.83V0h58.34zM22.083 45.428l-8.331-8.331 4.166-4.167 4.165 4.167 8.331-8.332-4.166-4.166-4.165 4.166-8.331 8.332-4.166-4.167 4.166-4.166 4.165-4.166 8.331 8.332 4.166 4.166 4.165-4.166 8.331-8.332 4.166 4.166 4.165 4.167-8.331 8.331-4.166-4.166-4.165-4.167-8.331 8.332-4.166 4.166-4.165 4.167-8.331-8.332-4.166-4.166-4.165-4.167 8.331-8.331 4.166 4.166 4.165 4.167 8.331-8.332 4.166-4.166 4.165-4.167-8.331 8.331-4.166 4.166-4.165 4.167z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
          backgroundRepeat: "repeat"
        }}
        animate={animEnabled ? {
          backgroundPosition: ["0px 0px", "60px 60px"]
        } : {}}
        transition={animEnabled ? {
          duration: 20,
          ease: "linear",
          repeat: Infinity
        } : {}}
      />

      {animEnabled && (
        <>
          {/* Subtle edge glowing */}
          <motion.div
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[30vw] rounded-full blur-[120px]"
            style={{ background: "rgba(255, 255, 255, 0.1)" }}
          />
        </>
      )}
    </div>
  );
}
