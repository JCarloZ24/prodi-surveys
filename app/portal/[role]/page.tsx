import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { defaultView } from "@/lib/portal-views";

// Bare /portal/{role} → the role's default view.
export default async function PortalRoleIndex() {
  const profile = await requireApproved();
  redirect(`/portal/${profile.role}/${defaultView()}`);
}
