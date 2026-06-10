type SendOtpResult = {
  ok: boolean;
  providerResult: any;
  rawValue: number | null;
};

function extractStatus(data: any): number | null {
  // فرمت‌های رایج پاسخ ملی‌پیامک
  const candidates = [
    data?.RetStatus,
    data?.retStatus,
    data?.Value,
    data?.value,
    data?.status,
    data?.Status,
  ];

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

export async function sendOtpSms(phone: string, code: string): Promise<SendOtpResult> {
  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;
  const bodyId = process.env.MELIPAYAMAK_BODY_ID; // مهم: string نگهش دار

  if (!username || !password || !bodyId) {
    throw new Error("Melipayamak env vars are not set correctly");
  }

  const payload = {
    username,
    password,
    to: phone,    // 09xxxxxxxxx
    bodyId,       // string
    text: code,   // مهم: برای این endpoint باید string باشد
  };

  const res = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  const statusCode = extractStatus(data);

  // منطق موفقیت:
  // - HTTP باید OK باشد
  // - اگر statusCode عددی بود، مثبت/1 را موفق فرض می‌کنیم
  const ok = res.ok && (statusCode === null ? true : statusCode > 0);

  return {
    ok,
    providerResult: data,
    rawValue: statusCode,
  };
}
