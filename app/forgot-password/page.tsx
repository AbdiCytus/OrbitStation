"use client";

import { useState } from "react";
import Link from "next/link";
import { SparklesIcon, EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: "#0b0c10" }}>
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 p-8 rounded-3xl border border-white/10" 
           style={{ background: "rgba(15, 15, 25, 0.6)", backdropFilter: "blur(24px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
            <SparklesIcon className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-sm text-gray-400">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="pilot@orbitstation.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors flex justify-center items-center"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
