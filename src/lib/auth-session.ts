import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "app_session";
const SESSION_EXPIRES_DAYS = 30;

type SessionPayload = {
  userId: string;
  phone?: string;
};

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function signSession(payload: SessionPayload) {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("OTP_SECRET is not set");

  return jwt.sign(payload, secret, {
    expiresIn: `${SESSION_EXPIRES_DAYS}d`,
  });
}

export function verifySession(token: string) {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("OTP_SECRET is not set");

  return jwt.verify(token, secret) as SessionPayload & { iat: number; exp: number };
}
