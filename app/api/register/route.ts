import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

  await db.user.create({
    data: { email, name, password: hashed, username },
  });

  return NextResponse.json({ success: true });
}
