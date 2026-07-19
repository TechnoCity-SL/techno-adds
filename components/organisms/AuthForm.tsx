"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Something went wrong.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12 sm:px-0">
      <div className="flex flex-col gap-3">
        {/* Plain <a>, not <Link>: this must be a real full-page navigation so the
            browser follows the route handler's redirect to the OAuth provider,
            not client-side App Router navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/oauth/google"
          className="border-border hover:bg-accent flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
        >
          Continue with Google
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/oauth/facebook"
          className="border-border hover:bg-accent flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
        >
          Continue with Facebook
        </a>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <div className="bg-border h-px flex-1" />
        or
        <div className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-border rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border-border rounded-md border px-3 py-2 text-sm"
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
