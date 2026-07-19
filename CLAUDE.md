# CLAUDE.md — TechnoAds project instructions

This file is read by Claude Code at the start of every session in this repo. It is the standing contract for how code gets written here. Also read `PLAN.md` at the repo root for full product/strategy context before starting any new feature area.

## What this project is

**TechnoAds** (by Technocity) — a free-to-post classifieds marketplace for Sri Lanka, launching with three categories: **Vehicles, Property, Techno/Gadgets**. Mobile-first, SEO-driven, with phone-OTP-verified users and a paid "Top Ad / Super Ad" boost system (bank transfer + PayHere) layered on top of free listings.

## Stack (do not deviate without discussion)

- **Next.js 15, App Router, TypeScript strict mode**
- **Tailwind CSS + ShadCN/UI** for all components
- **Supabase** for Postgres, Auth (Google/Facebook/email), Storage, Row Level Security, Realtime, Edge Functions (production)
- **SQLite via Drizzle ORM** for local development only (see `PLAN.md` §4.1 "Local development environment") — RLS/`tsvector`/Realtime are Postgres-only and can't be exercised against local SQLite; those must be verified against the shared Supabase staging project before merge
- **Cloudinary** for all ad/user image storage and transforms — never store raw images in Supabase Storage or the repo
- **Upstash Redis** for rate limiting and hot-path caching
- **HUTCH SMS API** for OTP delivery (adapter in `lib/otp/providers/hutch.ts`)
- **PayHere** for card/wallet payments; manual bank-transfer flow as the alternative payment method
- **Resend + React Email** for transactional email
- **Zod** for all validation, client and server, from shared schemas
- **Vercel** for hosting/deploys

## Non-negotiable conventions

1. **Atomic design folder structure.** All UI lives under `/components/{atoms,molecules,organisms,templates}`. Next.js files under `/app` are thin route/page compositions only — they import templates, they do not contain business logic or large JSX trees directly.
2. **Mobile-first CSS.** Write Tailwind classes starting from the base (mobile) breakpoint and add `sm:`/`md:`/`lg:` as progressive enhancement. Never write a desktop layout first and cram in a mobile override later. Every new page/component must be checked at 375px width before being considered done.
3. **Zod everywhere.** Every API route (`app/api/**/route.ts`) and every form validates against a shared Zod schema in `/lib/validation`. No `any`. No untyped `req.body` access.
4. **Server-side authorization always, on every mutation.** Never trust a client-submitted `user_id` or resource ID for ownership — re-derive the authenticated user from the session server-side and check ownership before any write. This is enforced _in addition to_ Supabase Row Level Security, not instead of it — both layers must independently deny unauthorized access.
5. **Row Level Security is mandatory on every table that holds user data.** No table ships without an RLS policy reviewed against: "can user A read/write user B's row?" Write this as an explicit test case, not an assumption. Since local dev runs SQLite (no RLS support), this test case must be run against the shared Supabase staging project — a PR touching an RLS-covered table is not done until that staging check has passed.
6. **No secrets in code, ever.** All API keys (HUTCH, PayHere, Cloudinary, Supabase service role, Resend) go in environment variables via Vercel/Supabase secrets. The Supabase **service role key** must never be referenced from any file that ships to the client bundle — server-only files/route handlers only.
7. **Rate limit every user-writable endpoint** (OTP send, login, post-ad, chat message, report, search) via the shared Upstash Redis limiter in `/lib/rate-limit`. New write endpoints are not done until they have a rate limit.
8. **Provider adapters, not vendor lock-in scattered through the codebase.** SMS (HUTCH), payments (PayHere), email (Resend), and image handling (Cloudinary) are each wrapped in a single adapter module with a small, stable interface (e.g. `sendSms(to, message)`, `createCheckout(order)`) so call sites never import vendor SDKs directly. This is what lets you add a second SMS provider or switch payment gateways later without a rewrite.
9. **ISR by default for public listing/detail pages.** Category/location listing pages and ad-detail pages use `revalidate` (not `force-dynamic`) unless there's a specific reason a page must be fully dynamic. If you reach for `force-dynamic`, justify it in a code comment.
10. **Conventional commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`) and small, reviewable PRs scoped to one roadmap phase/feature at a time — do not bundle unrelated changes.
11. **No user-generated content rendered as raw HTML.** Ad titles, descriptions, and chat messages are always rendered as escaped text (or through a sanitizer if any rich text is ever introduced) — never `dangerouslySetInnerHTML` on user input.
12. **Every payment state transition is server-verified, never client-trusted.** PayHere success is only recorded after verifying the signed server-to-server notify/webhook payload. A client-side redirect to a "success" URL is informational only and must never itself mark an order as paid.
13. **Sinhala/Tamil readiness.** Even if English-only at MVP, keep user-facing copy in a strings/i18n layer (not hardcoded inline) so Sinhala/Tamil can be added later without a rewrite (ikman supports both — expect this to become a competitive requirement).

## Definition of done for any feature

- [ ] Works and looks correct at 375px, 768px, and 1280px+ widths
- [ ] Zod validation on both client and server
- [ ] Server-side auth/ownership check on any mutation, RLS policy exists and is tested against Supabase staging (not just local SQLite)
- [ ] Rate limit applied if it's a write endpoint
- [ ] No secrets/vendor SDKs leaked into client bundle
- [ ] Loading and error states handled (not just the happy path)
- [ ] Lighthouse mobile score checked if it's a public page
- [ ] No `any`, no unused exports, passes lint/typecheck

## Where to look first

- `PLAN.md` — full strategy, architecture, data model, and phased roadmap
- `/lib/validation` — shared Zod schemas
- `/lib/supabase` — DB/auth client helpers (RLS-aware)
- `/lib/otp` — HUTCH OTP send/verify adapter
- `/lib/payments` — PayHere + bank-transfer order/checkout logic
- `/components/atoms|molecules|organisms|templates` — UI, atomic design

## Current phase

Check `PLAN.md`'s **Build Status & Progress Log** section (near the top) for the current phase and only build what that phase calls for — resist scope creep into later phases mid-session.

## Keeping PLAN.md current (living document — not a one-time spec)

`PLAN.md` must stay in sync with reality. Every session that touches plan-relevant work:

1. **Before starting a phase/task**, check the Build Status & Progress Log table in `PLAN.md` and mark that phase/row "In progress" if it isn't already.
2. **After finishing a phase or a meaningful chunk of one**, update that row to "Done" (or leave "In progress" with a one-line note of what landed) — don't let the log go stale.
3. **If the work changes the plan itself** — new scope, a stack/vendor swap, re-sequenced phases, a reversed decision, a new requirement discovered mid-build — edit the relevant section of `PLAN.md` directly, **and** bump the version number + add a dated changelog entry at the very top of the file (follow the existing `vX.Y changelog` format). Status-only updates (ticking a checkbox) don't need a version bump; actual content/decision changes do.
4. Treat `PLAN.md` as the source of truth for "what phase are we on" and "why did we decide X" — if it disagrees with what's actually built, fix the doc in the same session, don't defer it.
