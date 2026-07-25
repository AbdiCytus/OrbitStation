"use client";

import Link from "next/link";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "RocketLaunchIcon",
    title: "Sectors",
    desc: "Organize bookmarks into themed Sectors. Keep your workspaces clean and clearly separated.",
  },
  {
    icon: "SparklesIcon",
    title: "Smart Beacons",
    desc: "Auto-fetch OG images, titles, and descriptions effortlessly when you paste a URL.",
  },
  {
    icon: "GlobeAltIcon",
    title: "Public Profile",
    desc: "Share your Station publicly. Let others explore your carefully curated collection.",
  },
  {
    icon: "ChartBarIcon",
    title: "Visit Tracking",
    desc: "Track how often you visit each beacon. Discover your most-used digital destinations.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function LandingClient() {
  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 selection:bg-indigo-500/30 font-sans overflow-hidden">
      {/* Premium Minimalist Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle radial gradient to act as a spotlight */}
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.03 }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Modern Nav */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full"
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Orbit Station" className="h-8 w-auto object-contain" />
            <span className="text-white font-semibold tracking-tight text-lg hidden sm:block">Orbit Station</span>
          </div>
          <Link href="/login" className="px-5 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md">
            Sign In
          </Link>
        </motion.nav>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center max-w-3xl"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Your Personal Bookmark Universe
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
              Organize the Web. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Command Your Stars.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
              Orbit Station is a beautifully crafted portal for your digital life. Save links into thematic sectors, share your collection, and revisit what matters effortlessly.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login" className="px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Launch Your Station <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a href="#features" className="px-8 py-3.5 rounded-full bg-transparent text-white font-medium hover:bg-white/5 transition-colors">
                Explore Features
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Product Preview / Aesthetic Element */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-5xl mx-auto px-6 mb-32"
        >
          <div className="relative rounded-2xl md:rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img 
              src="/banner-icon.png" 
              alt="Orbit Station Interface" 
              className="w-full h-auto rounded-xl md:rounded-2xl border border-white/5 object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        </motion.section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 border-t border-white/5 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Everything you need.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">A modern bookmark manager built for clarity, speed, and beautiful sharing.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div 
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-indigo-400">
                    <DynamicIcon name={f.icon} width={24} height={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/5 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Orbit Station" className="h-6 w-auto opacity-70 grayscale" />
              <span className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} Orbit Station.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
