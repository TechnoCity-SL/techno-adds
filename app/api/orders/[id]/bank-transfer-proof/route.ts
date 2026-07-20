import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitBankTransferProofSchema } from "@/lib/validation/bank-transfer";
import {
  submitBankTransferProof,
  OrderNotOwnedError,
  OrderNotEligibleError,
} from "@/lib/orders/bank-transfer";
import { submitProofLimiter } from "@/lib/rate-limit/bank-transfer";
import { checkLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(submitProofLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = submitBankTransferProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await submitBankTransferProof(
      authData.user.id,
      id,
      parsed.data.cloudinaryPublicId,
    );
    return NextResponse.json({ status: "awaiting_confirmation" });
  } catch (error) {
    if (error instanceof OrderNotOwnedError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderNotEligibleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
