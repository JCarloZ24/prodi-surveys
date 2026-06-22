import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { generateUniqueSlug } from "@/lib/slug";
import { sendOtp } from "@/lib/otp";

// Only self-service roles may sign up. Admins are seeded, never created here.
const SIGNUP_ROLES = ["enumerator", "stakeholder"] as const;
type SignupRole = (typeof SIGNUP_ROLES)[number];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    role?: string;
    email?: string;
    password?: string;
    full_name?: string;
    region?: string;
    organization?: string;
  };

  const role = body.role as SignupRole | undefined;
  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";
  const fullName = body.full_name?.trim() ?? "";

  if (!role || !SIGNUP_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const db = createAdminClient();

  // Enumerators get a unique slug for their referral links.
  const slug = role === "enumerator" ? await generateUniqueSlug(fullName) : null;

  // email_confirm: true marks the address confirmed in Supabase so password
  // login works regardless of the dashboard "Confirm email" setting. Our own
  // is_email_verified flag (set via OTP) is the real email check, and status
  // stays 'pending' until an admin approves.
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: fullName,
      slug,
      region: body.region?.trim() || null,
      organization: body.organization?.trim() || null,
    },
  });

  if (error) {
    const already = /registered|already|exists/i.test(error.message);
    return NextResponse.json(
      { error: already ? "An account with this email already exists." : error.message },
      { status: already ? 409 : 500 },
    );
  }

  try {
    await sendOtp(email);
  } catch (e) {
    console.error("Signup OTP send error:", e);
    // Account exists; the verify-email page can resend if the email failed.
  }

  return NextResponse.json({ ok: true, role });
}
