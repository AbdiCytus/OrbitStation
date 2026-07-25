"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SparklesIcon, LockClosedIcon } from "@heroicons/react/24/outline";

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
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
        <p className="text-gray-400">Your password has been successfully updated.</p>
        <Link
          href="/login"
          className="inline-block w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Proceed to Login
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <p className="text-red-400">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !password || !confirmPassword}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 mt-6 transition-colors flex justify-center items-center"
      >
        {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: "#0b0c10" }}>
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
          <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-sm text-gray-400">Please enter your new password</p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
