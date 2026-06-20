# Prodi-Surveys

Survey verification & fieldwork operations portal for the **Prodigitality** baseline study —
a Next.js implementation of the design prototype.

It has two faces:

- **Staff portal** (role-gated for Admin / Enumerator / Stakeholder): Dashboard, Respondents,
  Referrals, QA Review, Payouts, Enumerators, Reports/Export, Emails, Audit Log, Settings, plus a
  respondent profile drawer.
- **Respondent flow**: an 8-step survey wizard (welcome → register → email OTP → respondent profile
  with gov/tech/food qualification branching → path-specific survey → identity selfie → payout →
  review → success/referral).

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (brand tokens in `tailwind.config.ts`)
- Fonts: Plus Jakarta Sans + JetBrains Mono via `next/font`

## Mock data (no database yet)

All data is generated client-side and held in a React context store. There is **no backend** — this
is a faithful, fully-interactive mock:

- `lib/mockData.ts` — deterministic seeded dataset (respondents + audit log).
- `lib/store.tsx` — `PortalProvider` holding all state + actions (the prototype's `Component` class).
- `lib/selectors.ts` — derived dashboard/table aggregations.
- `lib/survey.ts`, `lib/classify.ts`, `lib/emails.ts`, `lib/format.ts`, `lib/icons.tsx` — survey
  instruments, qualification logic, email templates, formatters, icons.

The data layer is isolated so it can later be swapped for a real API without touching the UI.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build / typecheck
npm run lint
```

Sign in with any of the **Quick demo access** buttons (or the dark "Sign in" button = Admin). Use the
role switcher in the top bar to preview Enumerator and read-only Stakeholder views. Launch the
respondent flow from the **Respondent flow** button in the top bar.
