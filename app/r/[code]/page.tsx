import { ReferralPageClient } from "../ReferralPageClient";

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ReferralPageClient code={decodeURIComponent(code)} />;
}
