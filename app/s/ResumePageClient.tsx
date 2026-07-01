"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal, FLOW_DRAFT_KEY } from "@/lib/store";
import type { Registration, Qual, RespondentType } from "@/lib/types";

export interface ResumeDraft {
  submissionId: string;
  accessCode: string;
  reg: Partial<Registration>;
  qual: Partial<Qual>;
  rType: RespondentType;
  enumeratorSlug: string;
  consent: { terms?: boolean; privacy?: boolean; accepted_at?: string | null } | null;
  startStep: number;
}

function ResumeFlow({ draft }: { draft: ResumeDraft }) {
  const { actions } = usePortal();

  useEffect(() => {
    // Clear any stale local draft first so a previous respondent's session on a
    // shared device can't leak into this one, then hydrate from the server draft.
    if (typeof window !== "undefined") window.localStorage.removeItem(FLOW_DRAFT_KEY);
    actions.resumeFromDraft({
      submissionId: draft.submissionId,
      accessCode: draft.accessCode,
      reg: draft.reg as Registration,
      qual: draft.qual as Qual,
      rType: draft.rType,
      enumeratorSlug: draft.enumeratorSlug,
      consent: draft.consent,
      startStep: draft.startStep,
    });
  }, [actions, draft]);

  return <RespondentFlow />;
}

// Self-service survey opened from /s/<slug>/<access-code>: hydrate the enumerator's
// pre-filled draft and drop the respondent straight into the survey.
export function ResumePageClient({ draft }: { draft: ResumeDraft }) {
  return (
    <PortalProvider>
      <ResumeFlow draft={draft} />
      <Toast />
    </PortalProvider>
  );
}
