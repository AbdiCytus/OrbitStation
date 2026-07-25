"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "RocketLaunchIcon",
    title: "Sectors",
    desc: "Organize bookmarks into themed Sectors — Dev Tools, Entertainment, Research, anything.",
  },
  {
    icon: "SparklesIcon",
    title: "Smart Beacons",
    desc: "Auto-fetch OG images, titles, and descriptions when you paste a URL.",
  },
  {
    icon: "GlobeAltIcon",
    title: "Public Profile",
    desc: "Share your Station publicly. Let others explore your curated collection.",
  },
  {
    icon: "StarIcon",
    title: "Visit Tracking",
    desc: "Track how often you visit each beacon. Your most-used shortcuts earn more stars.",
  },
  {
    icon: "MoonIcon",
    title: "Cosmic Aesthetic",
    desc: "A beautifully crafted dark mode interface that feels like navigating through space.",
  },
  {
    icon: "ShieldCheckIcon",
    title: "Private & Secure",
    desc: "Your data remains yours. We prioritize security and privacy in every feature we build.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function LandingClient() {
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % FEATURES.length);
    }, 5000); // 5 seconds loop
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="landing-root">
      {/* Animated background */}
      <div className="cosmic-bg fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.5 }}></div>
        <div className="cosmic-comet"></div>
        <div className="cosmic-dust"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Nav */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="landing-nav"
        >
          <span className="navbar-logo" style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="Orbit Station" style={{ height: "48px", width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))" }} />
          </span>
          <Link href="/login" className="btn btn-secondary btn-sm" style={{ backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Sign In
          </Link>
        </motion.nav>

        {/* Hero */}
        <motion.section 
          className="landing-hero"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="landing-title">
            <span className="text-gradient" style={{ background: "linear-gradient(to right, #fff, #a78bfa)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 30px rgba(167, 139, 250, 0.4))" }}>Organize the Web.</span>
            <br />
            <span style={{ color: "#e2e8f0" }}>Navigate Your Stars.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="landing-subtitle" style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "600px", lineHeight: "1.8" }}>
            Orbit Station is your personal portal save web shortcuts into Sectors,
            share your collection publicly, and revisit what matters with one click.
          </motion.p>

          <motion.div variants={itemVariants} className="landing-cta" style={{ marginTop: "1rem" }}>
            <Link href="/login" className="btn btn-primary btn-lg landing-cta-main" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", border: "1px solid rgba(167, 139, 250, 0.5)", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Launch Your Station
            </Link>
          </motion.div>
        </motion.section>

        {/* About Section */}
        <motion.section
          className="landing-about"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
        >
          <motion.div variants={itemVariants} style={{ marginBottom: "3rem" }}>
            <img src="/banner-icon.png" alt="Orbit Station OS" style={{ width: "100%", maxWidth: "550px", height: "auto", margin: "0 auto", filter: "drop-shadow(0 0 25px rgba(139, 92, 246, 0.5))" }} />
          </motion.div>
          <motion.h2 variants={itemVariants} style={{ fontSize: "2rem", fontWeight: "bold", color: "#f8fafc", marginBottom: "1rem" }}>
            What is Orbit Station?
          </motion.h2>
          <motion.p variants={itemVariants} style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: "1.8", marginBottom: "1.5rem", textAlign: "justify" }}>
            Orbit Station is built to be your ultimate command center in the vast ocean of the internet. Unlike traditional, rigid bookmark managers, Orbit Station is designed with a premium, dynamic cosmic aesthetic and powered by <span style={{ color: "#a78bfa" }}>Smart Beacons</span>.
          </motion.p>
          <motion.p variants={itemVariants} style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: "1.8", textAlign: "justify" }}>
            Organize your essential web destinations into thematic <strong>Sectors</strong>, showcase your curated "Station" publicly as a futuristic digital business card, and seamlessly save tabs using our dedicated browser extension. It's not just a list of links—it's your personalized gateway to the digital universe.
          </motion.p>
        </motion.section>

        {/* Feature cards (Visual Deck) */}
        <motion.section 
          id="features"
          className="landing-features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          style={{ padding: "4rem 2rem", width: "100%", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <motion.h2 variants={itemVariants} style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#f8fafc", marginBottom: "4rem" }}>
            Features
          </motion.h2>

          {/* Deck Container */}
          <div style={{
            position: "relative",
            width: "50vw", // Setengah layar
            minWidth: "680px", // Mencegah rusak di layar kecil
            maxWidth: "1000px",
            height: "440px", // Ruang cukup untuk kartu naik
            margin: "0 auto",
            display: "flex",
            justifyContent: "center"
          }}>
            {/* The Cards in the Deck */}
            <div style={{
              position: "absolute",
              bottom: "40px",
              left: "0",
              right: "0",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
            }}>
              {FEATURES.map((f, index) => {
                const isActive = activeCard === index;
                return (
                  <motion.div 
                    key={f.title} 
                    animate={{
                      y: isActive ? -140 : 0, // Naik sebagian, masih ada sisa 20px di bawah pelat depan
                      zIndex: isActive ? 50 : 10 + index, // Z-index tertinggi saat aktif
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="landing-feature glass group" 
                    style={{ 
                      position: "relative",
                      marginLeft: index === 0 ? "0" : "-120px", // Bertumpuk rapat agar 6 kartu muat
                      flexShrink: 0,
                      width: "240px",
                      height: "300px", // Tinggi kartu
                      border: "1px solid rgba(255,255,255,0.08)", 
                      background: "linear-gradient(145deg, rgba(30,30,40,0.95) 0%, rgba(15,15,20,1) 100%)", 
                      backdropFilter: "blur(12px)",
                      padding: "1.5rem",
                      borderRadius: "20px",
                      textAlign: "left",
                      boxShadow: isActive ? "0 30px 60px -15px rgba(139, 92, 246, 0.6)" : "-10px 0 20px -5px rgba(0,0,0,0.5)",
                    }}
                  >
                    <span className="landing-feature-icon" style={{ color: "#a78bfa", background: "rgba(139, 92, 246, 0.1)", padding: "0.6rem", borderRadius: "12px", display: "inline-flex", marginBottom: "1rem", boxShadow: "inset 0 0 10px rgba(139, 92, 246, 0.2)" }}>
                      <DynamicIcon name={f.icon} width={24} height={24} />
                    </span>
                    <h3 className="landing-feature-title" style={{ fontSize: "1.1rem", color: "#f8fafc", fontWeight: "600", marginBottom: "0.5rem" }}>{f.title}</h3>
                    <p className="landing-feature-desc" style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.6" }}>{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Deck Visual Plate (Slot depan menutupi setengah kartu) */}
            <div style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              height: "160px", // Tinggi 160px menutupi setengah bawah kartu (300px) dan sebagian deskripsinya
              background: "linear-gradient(to bottom, rgba(20, 20, 25, 0.85), rgba(10, 10, 15, 1))",
              borderTop: "2px solid rgba(139, 92, 246, 0.4)",
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "24px 24px 12px 12px",
              zIndex: 100, // Menutupi kartu!
              backdropFilter: "blur(24px)",
              boxShadow: "0 -20px 40px -10px rgba(0,0,0,0.8), inset 0 2px 20px rgba(139, 92, 246, 0.2)",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              paddingTop: "1.5rem"
            }}>
              <div style={{ width: "80px", height: "4px", background: "rgba(139, 92, 246, 0.3)", borderRadius: "2px", boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" }} />
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="landing-footer" style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(10, 10, 15, 0.5)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img src="/logo.png" alt="Orbit Station" style={{ height: "36px", width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))" }} />
            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
              &copy; {new Date().getFullYear()} Orbit Station. All rights reserved.
            </span>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
            <a href="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
