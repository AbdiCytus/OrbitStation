import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Delete existing reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: `${user.id}_reset` }
    });

    await db.verificationToken.create({
      data: {
        identifier: `${user.id}_reset`,
        token,
        expires,
      }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your Orbit Station account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Orbit Station - Password Reset",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
