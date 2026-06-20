import { SurveyOnlyPageClient } from "../SurveyOnlyPageClient";

export default async function SurveyOnlyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SurveyOnlyPageClient code={decodeURIComponent(code)} />;
}
