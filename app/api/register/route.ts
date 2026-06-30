import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip, 5, 3600000)) {
    return NextResponse.json({ error: "Too many registrations from this IP. Please try again later." }, { status: 429 });
  }

  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  let user;
  const existing = await db.user.findUnique({ where: { email } });
  
  if (existing) {
    if (existing.emailVerified) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    } else {
      // Overwrite unverified account so the real owner isn't locked out
      const hashed = await bcrypt.hash(password, 12);
      user = await db.user.update({
        where: { email },
        data: { name, password: hashed },
      });
      // Cleanup old tokens
      await db.verificationToken.deleteMany({ where: { identifier: email } });
    }
  } else {
    const hashed = await bcrypt.hash(password, 12);
    let username = `Pilot${Math.floor(1000 + Math.random() * 9000)}`;
    while (await db.user.findUnique({ where: { username } })) {
      username = `Pilot${Math.floor(1000 + Math.random() * 9000)}`;
    }
    user = await db.user.create({
      data: { email, name, password: hashed, username },
    });
  }

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Construct verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Welcome to Orbit Station - Verify your email",
    html: `
      <h2>Welcome to Orbit Station, Pilot ${name}!</h2>
      <p>To ensure the security of your station and unlock all communication channels, we need you to verify your email address.</p>
      <div style="margin: 20px 0;">
        <a href="${verifyUrl}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>Safe travels!</p>
    `,
  });

  // LOG FOR LOCAL DEVELOPMENT / DEBUGGING
  console.log('\n\n=== [DEV] VERIFICATION LINK ===');
  console.log(verifyUrl);
  console.log('===============================\n\n');

  return NextResponse.json({ success: true, message: "Verification email sent" });
}
