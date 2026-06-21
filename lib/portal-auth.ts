import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import type { Role } from "./types";

const COOKIE = "prodi_portal_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  role: Role;
  exp: number;
}

function secret() {
  const s = process.env.PORTAL_SESSION_SECRET;
  if (!s) throw new Error("PORTAL_SESSION_SECRET is not set");
  return s;
}

function sign(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function parse(cookie: string): SessionPayload | null {
  const dot = cookie.lastIndexOf(".");
  if (dot < 1) return null;
  const data = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(data).digest("base64url");
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// Used in middleware (NextRequest)
export function verifySession(req: NextRequest): SessionPayload | null {
  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) return null;
  return parse(cookie);
}

// Used in server components (next/headers cookies())
export function getSession(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): SessionPayload | null {
  const cookie = cookieStore.get(COOKIE);
  if (!cookie) return null;
  return parse(cookie.value);
}

export function sessionCookie(role: Role) {
  const payload: SessionPayload = {
    role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  return {
    name: COOKIE,
    value: sign(payload),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: MAX_AGE,
      path: "/",
    },
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    },
  };
}

export const ROLE_PASSWORDS: Record<Role, string> = {
  admin: process.env.ADMIN_PASSWORD ?? "",
  enumerator: process.env.ENUMERATOR_PASSWORD ?? "",
  stakeholder: process.env.STAKEHOLDER_PASSWORD ?? "",
};
