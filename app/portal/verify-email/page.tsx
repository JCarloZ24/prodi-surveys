import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { VerifyEmailForm } from "@/components/portal/VerifyEmailForm";

export default async function VerifyEmailPage() {
  const profile = await getProfile();
  if (!profile) redirect("/portal/login");
  if (profile.is_email_verified) redirect("/portal/pending");

  return <VerifyEmailForm email={profile.email} />;
}
