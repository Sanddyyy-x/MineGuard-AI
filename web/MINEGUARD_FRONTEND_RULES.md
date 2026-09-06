# MineGuard AI — Frontend Development Rules

## 1. Project identity

MineGuard AI is an AI-based Smart Governance & Compliance Monitoring System for Coal Mines.

This repository is a multi-part team project:
- `web/` — website frontend, owned/maintained by Varchasva
- `database/` — central database/Supabase work, owned/maintained by Sandeep
- `mobile/` — mobile application, owned/maintained by Shravan
- `ai/` — AI-related project work

The website frontend is an existing codebase originally generated and iteratively modified in Bolt.new. Treat the existing source code as the source of truth.

## 2. Core rule for all AI coding assistants

DO NOT rebuild this frontend from scratch.

Before changing code:
1. Inspect the existing project structure.
2. Inspect the relevant route and its components.
3. Inspect existing types and data-access code.
4. Make the smallest change necessary.
5. Do not rewrite unrelated modules.
6. Preserve the existing visual design unless explicitly asked to redesign it.
7. Preserve existing routes, navigation, component conventions, and TypeScript types whenever possible.

This applies to Cursor, Gemini/Google AI Studio, Copilot, Bolt, or any other coding assistant.

## 3. Technology

Current exported project:
- Next.js 13.5.1
- React 18.2.0
- TypeScript 5.2.2
- Tailwind CSS 3.3.3
- Supabase JS 2.58.0
- Lucide React
- Recharts
- Radix/shadcn-style UI components

Do not upgrade major frameworks/packages merely for convenience. Upgrade only when explicitly approved and after checking compatibility.

## 4. Existing frontend areas

Current routes include:
- `/dashboard`
- `/mines`
- `/mines/[mineId]`
- `/compliance`
- `/inspections`
- `/observations`
- `/violations`
- `/corrective-actions`
- `/alerts`
- `/gis`
- `/ai-risk`
- `/reports`
- `/settings`

The dashboard/sidebar and major modules already exist.

## 5. Current data architecture

The exported frontend currently uses mock data for much of the UI:
- `lib/mock-data.ts`
- `lib/mock-compliance.ts`

Do not delete mock data until the corresponding real Supabase data source is working and verified.

Migration principle:

Existing UI
    ↓
frontend data-access/service layer
    ↓
Supabase client
    ↓
Sandeep's existing Supabase database

Do not create a second database.

Do not create MongoDB, Firebase, Express, or another backend unless explicitly approved.

## 6. Supabase contract

The central Supabase database is authoritative.

Relevant existing tables include:
- `mines`
- `compliance_records`
- `inspections`
- `observations`
- `violations`
- `corrective_actions`
- `alerts`

Do not rename database fields or redesign the schema from the frontend.

When integrating a page:
1. Read the actual database schema.
2. Map database fields to existing frontend types.
3. Prefer a data-access/service layer rather than scattering Supabase queries through UI components.
4. Preserve the existing UI.

## 7. Supabase security

Frontend may use the Supabase publishable key through environment variables.

Never expose or commit:
- Supabase service-role key
- Supabase secret keys
- private API keys
- `.env.local`

Use environment variables such as:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

Never hard-code credentials in TypeScript/TSX files.

Frontend visibility is NOT security. Database access must be enforced by Supabase Auth/RLS.

## 8. Existing Supabase client

The current export contains:

`lib/supabase-client.ts`

It currently reads environment variables and creates the Supabase client.

Do not create a second Supabase client file unless there is a specific architectural reason.

The current export uses the variable name `NEXT_PUBLIC_SUPABASE_ANON_KEY`. During integration, evaluate the existing client and migrate it carefully to the publishable-key variable supplied by the project owner. Do not put the actual key into source control.

## 9. Team responsibilities

Varchasva:
- website frontend
- frontend UI/UX
- frontend routes/components
- frontend integration with the central Supabase system

Sandeep:
- central Supabase/database
- database schema
- Auth/RLS
- central backend/platform
- hosting/integration

Shravan:
- mobile app
- app backend
- offline sync

Offline synchronization for the mobile application is NOT a website frontend responsibility.

## 10. Important scope rule

CCTV detection is NOT part of MineGuard AI's current scope.

Do not add CCTV monitoring/detection unless the project scope is explicitly changed.

## 11. Current known frontend issue

The exported snapshot contains:

`app/(app)/compliance/page.tsx`

but the Compliance detail route is not present in the exported source snapshot. The Compliance list therefore may navigate to a missing detail route/404.

Fix this as a targeted frontend task; do not redesign the Compliance module.

## 12. Mock data warning

Mock data contains synthetic/demo values. It is useful for UI development but is NOT authoritative project data.

Some mock alerts and operational values are intentionally synthetic.

When real Supabase data is connected, replace the data source rather than rebuilding the UI.

## 13. Routing and Next.js

For dynamic routes, follow the Next.js version actually installed in `package.json`.

Do not introduce patterns incompatible with the installed version.

When using client-side hooks (`useState`, `useEffect`, etc.) in a component treated as a Server Component, add `"use client"` at the top.

## 14. UI rules

Keep the existing MineGuard visual language:
- professional enterprise/government dashboard
- mining/compliance context
- clear severity/status indicators
- responsive layouts
- accessible controls
- Lucide icons
- existing Tailwind/shadcn-style components

Do not install another UI framework just because an AI assistant prefers it.

## 15. Git rules

Use small, meaningful commits.

Examples:
- `preserve bolt frontend snapshot`
- `add compliance detail route`
- `connect mines page to supabase`
- `connect compliance records to supabase`

Do not commit:
- `.env`
- `.env.local`
- `node_modules`
- `.next`
- build artifacts
- secrets

## 16. Safe AI workflow

For every non-trivial change:

1. Inspect.
2. Explain the intended change briefly.
3. Modify only relevant files.
4. Run typecheck/build where practical.
5. Test the affected route.
6. Report exactly which files changed.
7. Do not silently refactor unrelated code.

If a requested change requires changing the database schema, stop and ask for approval from the database owner rather than changing the schema from the frontend.

## 17. Golden rule

The goal is NOT to make the code look like it was written by a particular AI.

The goal is to preserve one stable MineGuard codebase while different humans and AI tools work on it safely.

Existing code + documented contracts + Git history = source of truth.
