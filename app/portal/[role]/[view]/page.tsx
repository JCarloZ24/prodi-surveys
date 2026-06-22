import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { PortalView } from "@/components/portal/StaffPortal";
import { defaultView, isViewAllowed } from "@/lib/portal-views";

// Renders a single portal view. Redirects to the role's default view if the
// requested view isn't permitted for that role.
export default async function PortalViewPage({
  params,
}: {
  params: Promise<{ role: string; view: string }>;
}) {
  const { view } = await params;
  const profile = await requireApproved();
  if (!isViewAllowed(profile.role, view)) {
    redirect(`/portal/${profile.role}/${defaultView()}`);
  }
  return <PortalView view={view} />;
}
