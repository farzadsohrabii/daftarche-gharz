"use client";

import { useMemo, useState } from "react";
import OtpInputBoxes from "@/components/OtpInputBoxes";

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const otpCode = useMemo(() => otp.join(""), [otp]);

  const sendCode = async () => {
    setMsg(null);
    setHasError(false);
    try {
      setLoading(true);
      const r = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setMsg(data.message || "خطا در ارسال کد");
        return;
      }
      setStep("otp");
      setMsg("کد تایید ارسال شد ✅");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setMsg(null);
    setHasError(false);

    if (otpCode.length !== 6) {
      setMsg("کد ۶ رقمی را کامل وارد کنید");
      setHasError(true);
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await r.json();

      if (!r.ok || !data.ok) {
        setMsg(data.message || "کد اشتباه است");
        setHasError(true);
        return;
      }

      setMsg("ورود موفق ✅");
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10"
    >
      {/* glow ها مثل صفحه اصلی */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="text-center text-2xl font-extrabold tracking-tight">
            ورود با موبایل
          </h1>
          <p className="mt-1 text-center text-sm text-slate-300">
            خوش اومدی 👋 برای ورود، شماره موبایل رو وارد کن
          </p>

          {step === "phone" ? (
            <div className="mt-6 space-y-3">
              <input
                type="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-orange-400/60 focus:ring-4 focus:ring-orange-500/20"
              />

              <button
                onClick={sendCode}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "در حال ارسال..." : "ارسال کد تایید"}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-center text-sm text-slate-300">
                کد ارسال‌شده به{" "}
                <span dir="ltr" className="font-bold text-white">
                  {phone}
                </span>{" "}
                را وارد کنید
              </p>

              <OtpInputBoxes value={otp} setValue={setOtp} hasError={hasError} />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={verifyCode}
                  disabled={loading}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? "در حال بررسی..." : "تایید کد"}
                </button>

                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp(["", "", "", "", "", ""]);
                    setHasError(false);
                    setMsg(null);
                  }}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                >
                  تغییر شماره
                </button>
              </div>
            </div>
          )}

          {msg && (
            <div
              className={`mt-4 rounded-xl px-3 py-2 text-sm border ${
                hasError
                  ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
