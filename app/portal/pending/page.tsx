import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { PendingView } from "@/components/portal/PendingView";

export default async function PendingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/portal/login");
  if (!profile.is_email_verified) redirect("/portal/verify-email");
  if (profile.status === "approved") redirect("/portal");

  return <PendingView status={profile.status} rejectedReason={profile.rejected_reason} />;
}
