import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
  }

  const verificationToken = await db.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (verificationToken.expires < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
    },
  });

  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  // Redirect to login or success page
  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
