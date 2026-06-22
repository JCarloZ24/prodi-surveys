import { SignupForm } from "@/components/portal/SignupForm";

export default function StakeholderSignupPage() {
  return (
    <SignupForm
      role="stakeholder"
      title="Stakeholder sign-up"
      subtitle="Create your account. We'll verify your email, then an administrator approves access."
      extraField={{ key: "organization", label: "Organization (optional)", placeholder: "e.g. DTI" }}
    />
  );
}
