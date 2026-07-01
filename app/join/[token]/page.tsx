import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import JoinSectorClient from "./join-client";

export const metadata = {
  title: "Join Sector — Orbit Station",
};

export default async function JoinSectorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${token}`);
  }

  const invite = await db.sectorInvite.findUnique({
    where: { token },
    include: {
      sector: {
        include: {
          station: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white" style={{ padding: "16px" }}>
        <div 
          className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-3xl text-center shadow-[0_0_40px_rgba(239,68,68,0.1)]"
          style={{ padding: "32px", margin: "16px" }}
        >
          <div className="text-5xl" style={{ margin: "0 0 16px 0" }}>🚫</div>
          <h1 className="text-2xl font-bold" style={{ margin: "0 0 8px 0" }}>Invalid Invite Link</h1>
          <p className="text-gray-400 text-sm" style={{ margin: "0 0 24px 0" }}>
            This invite link is invalid or has expired.
          </p>
          <a href="/" className="inline-block bg-white/10 hover:bg-white/20 rounded-xl transition-colors" style={{ padding: "12px 24px" }}>
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <JoinSectorClient 
      token={token} 
      sectorName={invite.sector.name} 
      ownerName={invite.sector.station.user.name || invite.sector.station.user.username || "Unknown"}
    />
  );
}
