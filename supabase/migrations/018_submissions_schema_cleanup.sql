-- Schema cleanup for the submissions table to mirror the respondent flow
-- (Profile -> Register -> Survey -> Selfie -> Token -> Submit) with no data loss.

-- Rename step columns to *_data
ALTER TABLE submissions RENAME COLUMN qualification TO profiles_data;
ALTER TABLE submissions RENAME COLUMN registration  TO registration_data;

-- Merge payout_details + shipping_details into one generic token_data
-- (only one is ever populated per row: payout for SME/AgriTech, shipping for TSI).
ALTER TABLE submissions RENAME COLUMN payout_details TO token_data;
UPDATE submissions
   SET token_data = shipping_details
 WHERE survey_type = 'TSI' AND shipping_details IS NOT NULL;
ALTER TABLE submissions DROP COLUMN shipping_details;

-- External Kobo (Enketo) survey timing: captured client-side around step 3.
ALTER TABLE submissions ADD COLUMN kobo_start timestamptz;
ALTER TABLE submissions ADD COLUMN kobo_end   timestamptz;

-- Fold lead.exit_reason into profiles_data, then drop the lead column.
-- (org name is already mirrored in profiles_data; exit_reason was the only unique datum.)
UPDATE submissions
   SET profiles_data = profiles_data || jsonb_build_object('exit_reason', lead->>'exit_reason')
 WHERE lead ? 'exit_reason';
ALTER TABLE submissions DROP COLUMN lead;

-- Drop redundant / dead columns.
-- is_survey_completed is redundant with status; answers is unused now the survey
-- lives in external KoboToolbox; referrers are no longer paid (only enumerators).
ALTER TABLE submissions DROP COLUMN is_survey_completed;
ALTER TABLE submissions DROP COLUMN answers;
ALTER TABLE submissions DROP COLUMN referrer_payout_status;
ALTER TABLE submissions DROP COLUMN referrer_paid_at;

-- Clarify whose payout these columns track (the enumerator's flat per-survey fee).
ALTER TABLE submissions RENAME COLUMN payout_status TO enumerator_payout_status;
ALTER TABLE submissions RENAME COLUMN paid_at       TO enumerator_paid_at;
