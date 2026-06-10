import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth-session";

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${getSessionCookieName()}=`))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ ok: false }, { status: 401 });

    const session = verifySession(token);
    if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });

    return NextResponse.json({
      ok: true,
      user: {
        id: session.userId,
        phone: session.phone,
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
