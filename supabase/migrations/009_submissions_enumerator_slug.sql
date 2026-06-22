-- Every survey is opened from an enumerator's link (/s/<enumerator-slug>); record
-- which enumerator the submission is attributed to. referrer_code keeps holding
-- the optional referral code.
alter table public.submissions add column if not exists enumerator_slug text;
create index if not exists submissions_enumerator_slug_idx on public.submissions (enumerator_slug);
