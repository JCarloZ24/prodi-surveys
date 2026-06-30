-- Remove the referral/referrer system. The feature is no longer needed: the admin
-- Referrers page, the "How did you hear about this survey?" profile question, and the
-- post-survey referral opt-in have all been removed from the app.
--
-- The enumerator system is independent (enumerators live in `profiles` with a `slug`),
-- so dropping these objects does not affect enumerator survey links or attribution.
-- Referrer payout columns (referrer_payout_status / referrer_paid_at) were already
-- dropped in 019. The `generated_referral_code` key inside submissions.registration_data
-- (JSONB) is left as historical data; new submissions no longer write it.

ALTER TABLE submissions DROP COLUMN IF EXISTS referrer_code;
DROP TABLE IF EXISTS referrer;
DROP TYPE IF EXISTS referrer_type;
