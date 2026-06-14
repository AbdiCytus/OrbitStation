"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { LinkIcon, KeyIcon, RocketLaunchIcon } from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "oauth" | "login" | "register";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.1 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("oauth");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ... (handle methods below) ...

  async function handleOAuth(provider: "github" | "google") {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/station" });
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/station");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      // Auto-login after register
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        setMode("login");
        setError("Account created! Please sign in.");
      } else {
        router.push("/station");
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
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
        className="login-card glass relative z-10 w-full max-w-[480px] mx-auto p-8 flex flex-col gap-6"
        style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.1)" }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="login-logo text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#a78bfa", boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gradient" style={{ background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Orbit Station</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Your personal web portal in the stars</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex p-1.5 rounded-2xl" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}>
          {(["oauth", "login", "register"] as AuthMode[]).map((m) => (
            <button
              key={m}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 h-[60px] px-1 sm:px-2 text-[0.8rem] sm:text-[1rem] font-bold rounded-[10px] transition-all duration-200 relative bg-transparent border-none focus:outline-none ${mode === m ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              onClick={() => { setMode(m); setError(null); }}
              style={{ background: "transparent" }}
            >
              {mode === m && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute inset-0 rounded-[10px]" 
                  style={{ background: "rgba(139, 92, 246, 0.25)", border: "1px solid rgba(139, 92, 246, 0.5)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(139, 92, 246, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {m === "oauth" && <LinkIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
                {m === "login" && <KeyIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
                {m === "register" && <RocketLaunchIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* OAuth mode */}
          {mode === "oauth" && (
            <motion.div key="oauth" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
              <button
                className="w-full flex items-center justify-center gap-3 h-[60px] px-4 rounded-xl font-bold text-[1.05rem] transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc" }}
                onClick={() => handleOAuth("github")}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === "github" ? <span className="spinner" /> : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                Continue with GitHub
              </button>

              <button
                className="w-full flex items-center justify-center gap-3 h-[60px] px-4 rounded-xl font-bold text-[1.05rem] transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc" }}
                onClick={() => handleOAuth("google")}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === "google" ? <span className="spinner" /> : (
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>
            </motion.div>
          )}

          {/* Sign In form */}
          {mode === "login" && (
            <motion.form key="login" onSubmit={handleCredentialsLogin} variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[0.95rem] font-semibold text-purple-200 ml-1 drop-shadow-md">Email Address</label>
                <input
                  className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-white text-[1.05rem] placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all shadow-inner"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  type="email"
                  placeholder="pilot@station.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.95rem] font-semibold text-purple-200 ml-1 drop-shadow-md">Secure Password</label>
                <input
                  className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-white text-[1.05rem] placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all shadow-inner"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-3 h-[60px] rounded-2xl font-bold text-white text-[1.1rem] transition-all transform hover:scale-[1.02] active:scale-95"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4), inset 0 2px 5px rgba(255,255,255,0.2)" }}
                disabled={loading}
              >
                {loading ? <span className="spinner border-white" /> : "Initiate Launch"}
              </button>
            </motion.form>
          )}

          {/* Register form */}
          {mode === "register" && (
            <motion.form key="register" onSubmit={handleRegister} variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[0.95rem] font-semibold text-purple-200 ml-1 drop-shadow-md">Name</label>
                <input
                  className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-white text-[1.05rem] placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all shadow-inner"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  type="text"
                  placeholder="Commander Shepard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.95rem] font-semibold text-purple-200 ml-1 drop-shadow-md">Email Address</label>
                <input
                  className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-white text-[1.05rem] placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all shadow-inner"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  type="email"
                  placeholder="pilot@station.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[0.95rem] font-semibold text-purple-200 ml-1 drop-shadow-md">Secure Password</label>
                <input
                  className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl text-white text-[1.05rem] placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all shadow-inner"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                className="w-full mt-3 h-[60px] rounded-2xl font-bold text-white text-[1.1rem] transition-all transform hover:scale-[1.02] active:scale-95"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4), inset 0 2px 5px rgba(255,255,255,0.2)" }}
                disabled={loading}
              >
                {loading ? <span className="spinner border-white" /> : "Establish Connection"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <motion.p variants={itemVariants} className="text-xs text-center text-slate-500 mt-4">
          By continuing, you agree to Orbit Station's Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>
    </main>
  );
}
