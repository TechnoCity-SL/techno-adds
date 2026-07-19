import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PROVIDERS = ["google", "facebook"] as const;
type Provider = (typeof ALLOWED_PROVIDERS)[number];

function isAllowedProvider(value: string): value is Provider {
  return (ALLOWED_PROVIDERS as readonly string[]).includes(value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isAllowedProvider(provider)) {
    return NextResponse.json(
      { error: "Unsupported provider" },
      { status: 400 },
    );
  }

  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message ?? "OAuth initialization failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
