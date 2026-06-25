// Portal-wide settings persisted in the app_settings singleton row (migration
// 014). Read with the service-role client (RLS denies anon/auth). Used by the
// portal server layout (to seed the store) and the admin settings API route.

import { createAdminClient } from "@/lib/supabase-server";
import { DEFAULT_SURVEY_PAYOUT, DEFAULT_RESPONDENT_TOKEN } from "@/lib/selectors";
import type { Targets } from "@/lib/types";

export const DEFAULT_TARGETS: Targets = { TSI: 4, AgriTech: 10, SME: 100 };

export interface AppSettings {
  surveyPayout: number;
  respondentToken: number;
  targets: Targets;
}

function normalizeTargets(raw: unknown): Targets {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, d: number) => (typeof v === "number" && v >= 0 ? Math.round(v) : d);
  return {
    TSI: num(t.TSI, DEFAULT_TARGETS.TSI),
    AgriTech: num(t.AgriTech, DEFAULT_TARGETS.AgriTech),
    SME: num(t.SME, DEFAULT_TARGETS.SME),
  };
}

// Load the saved settings, falling back to defaults if the row/DB is unavailable.
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = createAdminClient();
    // select("*") so a missing respondent_token column (pre-migration) doesn't
    // error the query and wipe survey_payout/targets back to defaults.
    const { data } = await db
      .from("app_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (data) {
      return {
        surveyPayout:
          typeof data.survey_payout === "number" && data.survey_payout >= 0
            ? data.survey_payout
            : DEFAULT_SURVEY_PAYOUT,
        respondentToken:
          typeof data.respondent_token === "number" && data.respondent_token >= 0
            ? data.respondent_token
            : DEFAULT_RESPONDENT_TOKEN,
        targets: normalizeTargets(data.targets),
      };
    }
  } catch {
    // DB unavailable — fall back to defaults below.
  }
  return {
    surveyPayout: DEFAULT_SURVEY_PAYOUT,
    respondentToken: DEFAULT_RESPONDENT_TOKEN,
    targets: { ...DEFAULT_TARGETS },
  };
}
