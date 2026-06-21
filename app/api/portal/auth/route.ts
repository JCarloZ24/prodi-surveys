import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, clearSessionCookie, ROLE_PASSWORDS, ROLE_EMAILS } from "@/lib/portal-auth";
import type { Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["admin", "enumerator", "stakeholder"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    role?: string;
    password?: string;
    email?: string;
  };

  // Email-based login: map email → role, then verify that role's password
  if (body.email) {
    const email = body.email.toLowerCase().trim();
    const role  = ROLE_EMAILS[email];
    if (!role) {
      return NextResponse.json({ error: "Unrecognized email address" }, { status: 401 });
    }
    const expected = ROLE_PASSWORDS[role];
    if (!expected || body.password !== expected) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    const cookie = sessionCookie(role);
    const res    = NextResponse.json({ ok: true, role });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  }

  // Legacy role-based login (kept for internal tooling/scripts)
  const role     = body.role as Role | undefined;
  const password = body.password ?? "";
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const expected = ROLE_PASSWORDS[role];
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const cookie = sessionCookie(role);
  const res    = NextResponse.json({ ok: true, role });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

export async function DELETE(_req: NextRequest) {
  const c = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
