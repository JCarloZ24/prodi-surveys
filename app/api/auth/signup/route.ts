import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { isValidSlug } from "@/lib/slug";
import { isSlugAvailable } from "@/lib/slug-server";
import { payoutError } from "@/lib/payout";
import { sendOtp } from "@/lib/otp";

// Only self-service roles may sign up. Admins are seeded, never created here.
const SIGNUP_ROLES = ["enumerator", "stakeholder"] as const;
type SignupRole = (typeof SIGNUP_ROLES)[number];

type PayoutDetails = {
  method?: string;
  acctName?: string;
  acctNum?: string;
  bank?: string;
};

// Validate using the shared payout rules (coercing optional fields to strings).
function validatePayout(p: PayoutDetails | undefined): string | null {
  if (!p || typeof p !== "object") return "Payout details are required";
  return payoutError({
    method: (p.method ?? "").trim(),
    acctName: (p.acctName ?? "").trim(),
    acctNum: (p.acctNum ?? "").trim(),
    bank: (p.bank ?? "").trim(),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    role?: string;
    email?: string;
    password?: string;
    full_name?: string;
    mobile?: string;
    region?: string;
    organization?: string;
    slug?: string;
    payout_details?: PayoutDetails;
  };

  const role = body.role as SignupRole | undefined;
  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const mobile = body.mobile?.trim() ?? "";

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
  if (!mobile) {
    return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
  }

  // Enumerators choose a unique slug and provide payout details.
  let slug: string | null = null;
  let payoutDetails: PayoutDetails | null = null;
  if (role === "enumerator") {
    slug = body.slug?.toLowerCase().trim() ?? "";
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Choose a valid handle" }, { status: 400 });
    }
    if (!(await isSlugAvailable(slug))) {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    }

    const payoutError = validatePayout(body.payout_details);
    if (payoutError) {
      return NextResponse.json({ error: payoutError }, { status: 400 });
    }
    payoutDetails = {
      method: body.payout_details!.method!.trim(),
      acctName: body.payout_details!.acctName!.trim(),
      acctNum: body.payout_details!.acctNum!.trim(),
      bank: (body.payout_details!.bank ?? "").trim(),
    };
  }

  const db = createAdminClient();

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
      mobile,
      region: body.region?.trim() || null,
      organization: body.organization?.trim() || null,
      payout_details: payoutDetails,
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
