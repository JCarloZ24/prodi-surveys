import { SurveyOnlyPageClient } from "../../../s/SurveyOnlyPageClient";

export default async function PreviewSurveyOnlyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const rType = typeof sp.t === "string" ? sp.t : undefined;
  return <SurveyOnlyPageClient code={decodeURIComponent(code)} rType={rType} preview />;
}
