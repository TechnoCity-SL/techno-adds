// No production domain/Vercel project is linked yet (PLAN.md Phase 0 status),
// so this defaults to localhost for dev — set NEXT_PUBLIC_SITE_URL once a
// real domain exists, needed for PayHere's absolute return/cancel/notify URLs.
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
