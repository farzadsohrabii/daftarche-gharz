import { NextResponse } from "next/server";
import { normalizeIranPhone } from "@/lib/phone";
import { setOtp } from "@/lib/otp-store";
import { sendOtpSms } from "@/lib/melipayamak";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone } = body as { phone?: string };

    const normalized = normalizeIranPhone(phone || "");
    if (!normalized) {
      return NextResponse.json(
        { ok: false, message: "شماره معتبر نیست" },
        { status: 400 }
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const ttl = Number(process.env.OTP_EXPIRE_SECONDS || 120);

    const sms = await sendOtpSms(normalized, code);

    console.log("SMS_PROVIDER_RESULT:", JSON.stringify(sms.providerResult, null, 2));
    console.log("SMS_PROVIDER_STATUS:", sms.rawValue);

    if (!sms.ok) {
      // در dev برای تست لوکال
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV OTP FALLBACK] ${normalized} -> ${code}`);
      }

      return NextResponse.json(
        {
          ok: false,
          message: "ارسال پیامک ناموفق بود",
          debugRaw: sms.rawValue,
          debugProvider: sms.providerResult,
        },
        { status: 502 }
      );
    }

    // فقط در صورت ارسال موفق، OTP ذخیره شود
    setOtp(normalized, code, ttl);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] ${normalized} -> ${code}`);
    }

    return NextResponse.json({ ok: true, ttl });
  } catch (e: any) {
    console.error("SEND_OTP_ERROR:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "خطا در ارسال کد" },
      { status: 500 }
    );
  }
}
