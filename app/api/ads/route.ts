import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdSchema } from "@/lib/validation/ads";
import {
  createAd,
  InvalidCategoryError,
  InvalidLocationError,
  InvalidAttributesError,
  UserBannedError,
} from "@/lib/ads/create-ad";
import { postAdLimiter } from "@/lib/rate-limit/ads";
import { checkLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(postAdLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many ads posted. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createAdSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const adId = await createAd({ userId: authData.user.id, ...parsed.data });
    return NextResponse.json(
      { id: adId, status: "pending_review" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UserBannedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (
      error instanceof InvalidCategoryError ||
      error instanceof InvalidLocationError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof InvalidAttributesError) {
      return NextResponse.json(
        { error: error.message, issues: error.issues },
        { status: 400 },
      );
    }
    console.error("createAd failed:", error);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}
