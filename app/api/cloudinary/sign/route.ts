import { NextResponse } from "next/server";
import { createUploadSignature } from "@/lib/cloudinary/upload";
import { uploadSignRequestSchema } from "@/lib/validation/cloudinary";

/**
 * TODO before Phase 2 (post-ad photo upload) ships: this route currently has
 * no auth check and no rate limit. It's safe as bare infrastructure today
 * (nothing links to it yet), but per CLAUDE.md rules #4 and #7 it MUST gain
 * both before any real upload flow calls it — an unauthenticated, unlimited
 * signature endpoint is a storage-abuse vector. Tracked in PLAN.md Phase 0 status.
 */
export async function POST(request: Request) {
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
