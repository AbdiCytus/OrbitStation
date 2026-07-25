"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div variants={itemVariants} className="text-center" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center" style={{ width: "4rem", height: "4rem" }}>
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-sm text-slate-400">Your password has been successfully updated.</p>
        </div>
        <Link
          href="/login"
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-500/50"
          style={{ height: "48px", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          Proceed to Login
        </Link>
      </motion.div>
    );
  }

  if (!token) {
    return (
      <motion.div variants={itemVariants} className="text-center" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p className="text-red-400 text-sm">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 text-sm">
          Request a new link
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.form variants={itemVariants} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center" style={{ padding: "0.75rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="text-[0.85rem] font-medium text-slate-300 ml-1" style={{ marginLeft: "0.25rem" }}>New Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none transition-colors group-focus-within:text-violet-400" style={{ paddingLeft: "0.875rem" }}>
              <LockClosedIcon className="h-[18px] w-[18px] text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.6rem" }}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="text-[0.85rem] font-medium text-slate-300 ml-1" style={{ marginLeft: "0.25rem" }}>Confirm Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none transition-colors group-focus-within:text-violet-400" style={{ paddingLeft: "0.875rem" }}>
              <LockClosedIcon className="h-[18px] w-[18px] text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0a0a0f]/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.6rem" }}
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !password || !confirmPassword}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-500/50"
        style={{ width: "100%", height: "48px", marginTop: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Update Password"}
      </button>
    </motion.form>
  );
}

export default function ResetPasswordPage() {
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
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#f8fafc", marginTop: "-0.25rem", letterSpacing: "0.5px", textShadow: "0 0 12px rgba(139, 92, 246, 0.6), 0 0 24px rgba(139, 92, 246, 0.4)" }}>Create New Password</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Please enter your new password</p>
        </motion.div>

        <Suspense fallback={<motion.div variants={itemVariants} className="text-center text-slate-400 text-sm">Loading...</motion.div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </main>
  );
}
