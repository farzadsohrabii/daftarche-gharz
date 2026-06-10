type OtpItem = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const store = new Map<string, OtpItem>();

export function setOtp(phone: string, code: string, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(phone, { code, expiresAt, attempts: 0 });
}

export function getOtp(phone: string) {
  const item = store.get(phone);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    store.delete(phone);
    return null;
  }
  return item;
}

export function increaseAttempt(phone: string) {
  const item = store.get(phone);
  if (!item) return;
  item.attempts += 1;
  store.set(phone, item);
}

export function clearOtp(phone: string) {
  store.delete(phone);
}
