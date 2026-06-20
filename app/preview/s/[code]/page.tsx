import { SurveyOnlyPageClient } from "../../../s/SurveyOnlyPageClient";

export default async function PreviewSurveyOnlyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SurveyOnlyPageClient code={decodeURIComponent(code)} preview />;
}
