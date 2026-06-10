import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeIranPhone } from "@/lib/phone";
import { clearOtp, getOtp, increaseAttempt } from "@/lib/otp-store";
import { signSession, getSessionCookieName } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body?.phone;
    const code = body?.code;

    const phone = normalizeIranPhone(rawPhone || "");
    if (!phone) {
      return NextResponse.json({ ok: false, message: "شماره معتبر نیست" }, { status: 400 });
    }

    const otpItem = getOtp(phone);
    if (!otpItem) {
      return NextResponse.json({ ok: false, message: "کد منقضی شده یا وجود ندارد" }, { status: 400 });
    }

    if (otpItem.attempts >= 5) {
      clearOtp(phone);
      return NextResponse.json({ ok: false, message: "تلاش بیش از حد. دوباره کد بگیر" }, { status: 429 });
    }

    if (otpItem.code !== String(code || "").trim()) {
      increaseAttempt(phone);
      return NextResponse.json({ ok: false, message: "کد اشتباه است" }, { status: 400 });
    }

    clearOtp(phone);

    if (!process.env.OTP_SECRET) {
      console.error("Missing OTP_SECRET");
      return NextResponse.json({ ok: false, message: "OTP_SECRET تعریف نشده" }, { status: 500 });
    }

    // 1) تلاش برای یافتن کاربر با phone
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (findErr) {
      console.error("FIND_USER_ERROR:", findErr);
      return NextResponse.json({ ok: false, message: "خطا در جستجوی کاربر" }, { status: 500 });
    }

    let userId = existing?.id ?? crypto.randomUUID();

    // 2) Upsert کاربر
    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert({ id: userId, phone }, { onConflict: "phone" })
      .select("id")
      .single();

    if (upsertErr || !upserted?.id) {
      console.error("UPSERT_USER_ERROR:", upsertErr);
      return NextResponse.json({ ok: false, message: "خطا در ذخیره کاربر" }, { status: 500 });
    }

    userId = upserted.id;

    // 3) ساخت توکن سشن
    const token = signSession({ userId, phone });

    const response = NextResponse.json({
      ok: true,
      user: { id: userId, phone },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 روز
    });

    return response;
  } catch (e: unknown) {
    console.error("VERIFY_OTP_ERROR:", e);
    const message = e instanceof Error ? e.message : "خطا در تایید کد";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
