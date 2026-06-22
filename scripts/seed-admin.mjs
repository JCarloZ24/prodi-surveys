// Seed (or repair) the super-admin account. Run once:
//   npm run seed:admin
// Credentials come from env (.env via --env-file):
//   SEED_ADMIN_EMAIL    (default admin@prodigitality.net)
//   SEED_ADMIN_PASSWORD (required)
//   SEED_ADMIN_NAME     (default "Super Admin")
// Requires SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.SEED_ADMIN_EMAIL || "admin@prodigitality.net").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_NAME || "Super Admin";

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!password) {
  console.error("SEED_ADMIN_PASSWORD is required.");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  // Page through users until we find the email (admin list is small).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId;

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: fullName },
  });

  if (createError) {
    if (/registered|already|exists/i.test(createError.message)) {
      console.log("Admin auth user already exists — repairing profile.");
      const existing = await findUserByEmail(email);
      if (!existing) throw new Error("User reported as existing but not found.");
      userId = existing.id;
      // Ensure the password and confirmation are set as expected.
      await db.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      throw createError;
    }
  } else {
    userId = created.user.id;
  }

  // The on_auth_user_created trigger created a pending profile; promote it.
  const { error: updateError } = await db
    .from("profiles")
    .update({
      role: "admin",
      status: "approved",
      is_email_verified: true,
      full_name: fullName,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  console.log(`Super admin ready: ${email}`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
