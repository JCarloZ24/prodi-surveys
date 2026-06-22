-- Track whether a submission's survey was actually finished. The row is now
-- created at the OTP verify step (is_survey_completed=false) and flipped to true
-- on final submit, so partial/abandoned responses are captured separately.
alter table public.submissions
  add column if not exists is_survey_completed boolean not null default false;

-- Backfill: every existing non-lead row is a completed submission (rows were only
-- ever inserted at final submit until now), so mark them complete. New partial
-- rows and leads keep the default false.
update public.submissions
  set is_survey_completed = true
  where coalesce(survey_type, '') <> 'lead';

create index if not exists submissions_is_survey_completed_idx
  on public.submissions (is_survey_completed);
