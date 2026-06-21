import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, clearSessionCookie, ROLE_PASSWORDS } from "@/lib/portal-auth";
import type { Role } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { role?: string; password?: string };
  const role = body.role as Role | undefined;
  const password = body.password ?? "";

  if (!role || !["admin", "enumerator", "stakeholder"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const expected = ROLE_PASSWORDS[role];
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const cookie = sessionCookie(role);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

export async function DELETE(_req: NextRequest) {
  const c = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
