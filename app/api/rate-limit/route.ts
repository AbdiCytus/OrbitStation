import { NextResponse } from "next/server";
import { incrementLoginRateLimit, checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email, action } = await req.json();
    
    if (action === "increment") {
      incrementLoginRateLimit(email, 1 * 60 * 1000);
      const rl = checkLoginRateLimit(email, 5, 1 * 60 * 1000);
      return NextResponse.json({ allowed: rl.allowed, ms: rl.remainingMs });
    }
    
    if (action === "check") {
      const rl = checkLoginRateLimit(email, 5, 1 * 60 * 1000);
      return NextResponse.json({ allowed: rl.allowed, ms: rl.remainingMs });
    }

    if (action === "reset") {
      resetLoginRateLimit(email);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
