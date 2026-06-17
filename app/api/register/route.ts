import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/resend";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  let username = `Pilot${Math.floor(1000 + Math.random() * 9000)}`;
  while (await db.user.findUnique({ where: { username } })) {
    username = `Pilot${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const user = await db.user.create({
    data: { email, name, password: hashed, username },
  });

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
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <br />
      <p>Safe travels!</p>
    `,
  });

  return NextResponse.json({ success: true, message: "Verification email sent" });
}
