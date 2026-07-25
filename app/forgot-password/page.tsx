"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
      } else {
        setMessage("If an account exists with that email, a password reset link has been sent.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Premium Cosmic Background */}
      <div className="cosmic-bg fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="cosmic-stars"></div>
        <div className="cosmic-aurora" style={{ opacity: 0.6, transform: "scale(1.2)" }}></div>
        <div className="cosmic-comet"></div>
        <div className="cosmic-dust"></div>
      </div>

      <motion.div 
        className="login-card glass relative z-10 w-full max-w-[480px] mx-auto p-8 flex flex-col gap-6 m-4"
        style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.1)" }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Logo and Header */}
        <motion.div variants={itemVariants} className="login-logo text-center">
          <img src="/logo.png" alt="Orbit Station" style={{ height: "84px", width: "auto", objectFit: "contain", margin: "0 auto", filter: "drop-shadow(0 0 16px rgba(139, 92, 246, 0.6))" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#f8fafc", marginTop: "-0.25rem", letterSpacing: "0.5px", textShadow: "0 0 12px rgba(139, 92, 246, 0.6), 0 0 24px rgba(139, 92, 246, 0.4)" }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Enter your email to receive a reset link</p>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center" style={{ padding: "0.75rem" }}>
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center" style={{ padding: "0.75rem" }}>
              {message}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label className="text-[0.85rem] font-medium text-slate-300 ml-1" style={{ marginLeft: "0.25rem" }}>Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none transition-colors group-focus-within:text-violet-400" style={{ paddingLeft: "0.875rem" }}>
                <EnvelopeIcon className="h-[18px] w-[18px] text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.6rem" }}
                placeholder="pilot@orbitstation.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-500/50"
            style={{ width: "100%", height: "48px", marginTop: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
          </button>
        </motion.form>

        <motion.div variants={itemVariants} className="text-center" style={{ marginTop: "-0.5rem" }}>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
            <ArrowLeftIcon className="w-4 h-4" />
            Back to login
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
