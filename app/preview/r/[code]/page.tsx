import { ReferralPageClient } from "../../../r/ReferralPageClient";

export default async function PreviewReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ReferralPageClient code={decodeURIComponent(code)} preview />;
}
