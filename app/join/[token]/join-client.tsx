"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinSectorByInviteToken } from "@/lib/actions/sector.actions";
import { toast } from "sonner";
import { UserGroupIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

export default function JoinSectorClient({ 
  token, 
  sectorName, 
  ownerName 
}: { 
  token: string; 
  sectorName: string;
  ownerName: string;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    const res = await joinSectorByInviteToken(token);
    
    if (res.error) {
      toast.error(res.error);
      setIsJoining(false);
    } else if (res.success) {
      toast.success(res.message);
      // Redirect to the sector in the user's station
      router.push("/station");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 60%)" }} 
      />
      
      <div 
        className="max-w-md w-full bg-[rgba(15,15,25,0.85)] backdrop-blur-xl border border-violet-500/30 rounded-[28px] text-center shadow-[0_0_50px_rgba(139,92,246,0.15)] relative z-10"
        style={{ padding: "32px", margin: "16px" }}
      >
        <div 
          className="w-20 h-20 bg-violet-600/20 border border-violet-500/50 rounded-2xl flex items-center justify-center shadow-inner"
          style={{ margin: "0 auto 24px auto" }}
        >
          <UserGroupIcon className="w-10 h-10 text-violet-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white" style={{ margin: "0 0 8px 0" }}>Join Sector</h1>
        <p className="text-gray-400 text-sm leading-relaxed" style={{ margin: "0 0 32px 0" }}>
          You have been invited to join the collaboration sector <strong className="text-violet-300">"{sectorName}"</strong> by <strong className="text-gray-300">{ownerName}</strong>.
        </p>

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-2xl transition-all shadow-[0_4px_15px_rgba(139,92,246,0.4)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none cursor-pointer"
          style={{ padding: "16px 24px", margin: "0 0 16px 0" }}
        >
          {isJoining ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <RocketLaunchIcon className="w-5 h-5" />
              <span>Accept & Join Sector</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => router.push("/")}
          className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-xl transition-colors border-none cursor-pointer"
          style={{ padding: "12px 24px", margin: "0" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
