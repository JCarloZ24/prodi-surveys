// Transactional email previews, ported from the design prototype's
// `emailDefs()`.

import type { EmailDef } from "./types";

export function emailDefs(): EmailDef[] {
  const link = "prodigitalitydata.live";
  return [
    {
      id: "verify", audience: "Respondent", name: "Verify your email",
      subject: "Your Prodi-Surveys verification code",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "Enter this code to verify your email and continue.",
      accent: "#4F46E5",
      blocks: [
        { type: "h", text: "Verify your email address" },
        { type: "p", text: "Thanks for registering for the Prodigitality baseline survey. Enter the code below to verify your email and continue to your survey." },
        { type: "code", text: "418 902" },
        { type: "note", text: "This code expires in 15 minutes. If you didn’t request it, you can safely ignore this email." },
      ],
    },
    {
      id: "invite", audience: "Respondent", name: "Survey invitation",
      subject: "You’re invited to the Prodigitality baseline survey",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "Takes about 5–10 minutes. Earn a token once verified.",
      accent: "#E0195F",
      blocks: [
        { type: "h", text: "You’ve been invited to take part" },
        { type: "p", text: "Hi Maria, you’ve been invited to participate in a baseline data collection study for food processing businesses and partners. The survey takes about 5–10 minutes." },
        { type: "btn", text: "Start the survey" },
        { type: "p", text: "Or paste this link into your browser:" },
        { type: "linkbox", text: link + "/s/INVITE-7F3K" },
        { type: "note", text: "You’ll receive a token once your response is verified by our team." },
      ],
    },
    {
      id: "verified", audience: "Respondent", name: "You’re verified",
      subject: "Your response is verified ✓",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "Your token is now being processed.", accent: "#15803D",
      blocks: [
        { type: "h", text: "Your response has been verified 🎉" },
        { type: "p", text: "Thank you, Maria. Our QA team has reviewed and verified your submission. Your respondent token is now being processed for payout." },
        { type: "kv", rows: [["Reference no.", "PS-7F3K"], ["Respondent token", "₱200"], ["Payout method", "GCash •••• 412"], ["Status", "Processing"]] },
        { type: "p", text: "You’ll receive another email once your token has been sent." },
      ],
    },
    {
      id: "followup", audience: "Respondent", name: "Needs follow-up",
      subject: "We need a bit more information",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "A quick clarification is needed on your submission.",
      accent: "#9A3412",
      blocks: [
        { type: "h", text: "We need a little more information" },
        { type: "p", text: "Thanks for your submission. Before we can verify it, our team needs to clarify one item:" },
        { type: "bullets", items: ["Please re-take your verification selfie in better lighting."] },
        { type: "btn", text: "Update my submission" },
        { type: "note", text: "No need to redo the full survey — your answers are saved." },
      ],
    },
    {
      id: "rejected", audience: "Respondent", name: "Submission not approved",
      subject: "Update on your survey submission",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "Your submission could not be verified.", accent: "#B91C1C",
      blocks: [
        { type: "h", text: "Your submission could not be verified" },
        { type: "p", text: "Thank you for your interest in the study. After review, we were unable to verify your submission and it will not proceed to payout." },
        { type: "p", text: "If you believe this was a mistake, you may reply to this email and our team will take another look." },
      ],
    },
    {
      id: "paid", audience: "Respondent", name: "Token sent",
      subject: "Your token has been sent",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "respondent",
      preheader: "Your respondent token has been released.", accent: "#15803D",
      blocks: [
        { type: "h", text: "Your token is on its way 💸" },
        { type: "p", text: "Your respondent token has been released to your chosen payout account." },
        { type: "kv", rows: [["Amount", "₱200"], ["Method", "GCash •••• 412"], ["Reference", "PAY-20461"], ["Date sent", "Jun 20, 2026"]] },
        { type: "note", text: "Please allow 1–3 business days for the amount to reflect." },
      ],
    },
    {
      id: "enuminvite", audience: "Enumerator", name: "Enumerator account invite",
      subject: "You’ve been added as a Prodi-Surveys enumerator",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "enumerator",
      accent: "#E0195F",
      preheader: "Set up your account to start collecting responses.",
      blocks: [
        { type: "h", text: "Welcome to the field team" },
        { type: "p", text: "Hi Grace, you’ve been added as an enumerator on the Prodigitality baseline survey project. Set up your account to start adding and assisting respondents." },
        { type: "btn", text: "Set up my account" },
        { type: "kv", rows: [["Role", "Enumerator"], ["Assigned region", "Region VII"], ["Portal", "prodigitalitydata.live"]] },
      ],
    },
    {
      id: "refbonus", audience: "Referrer", name: "Referral bonus eligible",
      subject: "Your referral was verified — bonus eligible",
      from: "Prodi-Surveys <no-reply@prodigitality.net>", to: "referrer",
      accent: "#7C3AED", preheader: "Someone you referred is now verified.",
      blocks: [
        { type: "h", text: "Good news — your referral was verified" },
        { type: "p", text: "A respondent you referred has completed and passed verification. Your referral bonus is now eligible for payout." },
        { type: "kv", rows: [["Referred respondent", "Island Beverages"], ["Your referral code", "PS-9K2D"], ["Referral bonus", "₱1,000"], ["Status", "Eligible"]] },
        { type: "note", text: "Bonuses are paid out after each referred respondent is verified." },
      ],
    },
    {
      id: "stakeholder", audience: "Stakeholder", name: "Weekly progress report",
      subject: "Prodi-Surveys — weekly progress report",
      from: "Prodi-Surveys <reports@prodigitality.net>", to: "stakeholder",
      accent: "#1F1147", preheader: "This week’s verified counts and pipeline.",
      blocks: [
        { type: "h", text: "Weekly progress report" },
        { type: "p", text: "Here’s the latest snapshot of the baseline data collection. Full read-only dashboard available in the portal." },
        { type: "kv", rows: [["Verified to date", "51 / 114"], ["Pending QA", "11"], ["Registered this week", "+14"], ["On track", "Yes"]] },
        { type: "btn", text: "Open the dashboard" },
        { type: "note", text: "Finance and personal details are excluded from stakeholder reports." },
      ],
    },
  ];
}
