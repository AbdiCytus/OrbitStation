import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken || verificationToken.expires < new Date() || !verificationToken.identifier.endsWith('_reset')) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const userId = verificationToken.identifier.replace('_reset', '');
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    await db.verificationToken.delete({
      where: { token }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
