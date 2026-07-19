import { NextResponse } from "next/server";
import { createUploadSignature } from "@/lib/cloudinary/upload";
import { uploadSignRequestSchema } from "@/lib/validation/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { cloudinarySignLimiter } from "@/lib/rate-limit/cloudinary";
import { checkLimit } from "@/lib/rate-limit";

/**
 * Auth + rate limit closed here (2026-07-19) now that the post-ad photo upload
 * flow actually calls this route — this was a deliberate, tracked gap since
 * Phase 0 (see PLAN.md Phase 0 status), not an oversight.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(cloudinarySignLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = uploadSignRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const signature = createUploadSignature(parsed.data);
  return NextResponse.json(signature);
}
