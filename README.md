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

## Team tooling — MCP servers

This repo ships project-scoped MCP servers in [`.mcp.json`](.mcp.json) so the whole team can drive
**Vercel** (deployments, logs, project management) and **Supabase** (database, when we wire it up)
from Claude Code / Cursor / other MCP clients. Both are remote servers with **per-user OAuth — no
secrets are committed**; everyone authenticates with their own account.

First time in the repo:

1. Open the project in Claude Code and **approve** the project MCP servers when prompted (project-scoped
   servers require explicit approval before they load).
2. Run `/mcp` and authenticate **vercel** and **supabase** in your browser.

Notes:

- Supabase is configured **read-only** and account-scoped by default. To scope it to one project and/or
  allow writes, edit the URL in `.mcp.json` — e.g.
  `https://mcp.supabase.com/mcp?project_ref=<your-project-ref>` (drop `read_only=true` to enable writes).
- Other clients: `npx add-mcp https://mcp.vercel.com`, or point any MCP client at the URLs in `.mcp.json`.
