import { SignupForm } from "@/components/portal/SignupForm";

export default function EnumeratorSignupPage() {
  return (
    <SignupForm
      role="enumerator"
      title="Enumerator sign-up"
      subtitle="Create your field account. We'll verify your email, then an administrator approves access."
      extraField={{ key: "region", label: "Region", placeholder: "e.g. NCR" }}
    />
  );
}
