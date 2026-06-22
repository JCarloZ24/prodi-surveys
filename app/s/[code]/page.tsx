import { SurveyOnlyPageClient } from "../SurveyOnlyPageClient";

export default async function SurveyOnlyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const rType = typeof sp.t === "string" ? sp.t : undefined;
  return <SurveyOnlyPageClient code={decodeURIComponent(code)} rType={rType} />;
}
