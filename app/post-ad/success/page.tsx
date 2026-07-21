import Link from "next/link";

export default async function PostAdSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-center">
      <div className="bg-accent pointer-events-none absolute top-[-50px] -z-10 h-64 w-64 rounded-full opacity-60 blur-3xl" />

      <main className="flex w-full max-w-md flex-col items-center">
        <div className="bg-card mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-lg">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m22 4-10 10-3-3" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Ad Submitted for Review
        </h1>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm leading-relaxed">
          Our team of moderators will check your ad within 24 hours to ensure
          everything looks good before it goes live on the marketplace.
          {id ? (
            <span className="mt-1 block text-xs opacity-70">
              Reference: {id}
            </span>
          ) : null}
        </p>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/my-ads"
            className="bg-primary text-primary-foreground flex h-14 items-center justify-center gap-2 rounded-xl text-base font-bold shadow-md transition-transform active:scale-95"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
            View My Ads
          </Link>
          <Link
            href="/"
            className="bg-muted text-primary flex h-14 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
            </svg>
            Go to Homepage
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <div className="bg-border h-2 w-2 rounded-full" />
          <div className="bg-border h-2 w-2 rounded-full" />
          <div className="bg-primary h-2 w-8 rounded-full" />
        </div>
      </main>
    </div>
  );
}
