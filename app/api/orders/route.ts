import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validation/orders";
import {
  createOrder,
  AdNotOwnedError,
  AdNotActiveError,
  InvalidListingProductError,
} from "@/lib/orders/create-order";
import { createOrderLimiter } from "@/lib/rate-limit/orders";
import { checkLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(createOrderLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many orders created. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { orderId, amountLkr } = await createOrder(
      authData.user.id,
      parsed.data.adId,
      parsed.data.listingProductId,
      parsed.data.paymentMethod,
    );
    return NextResponse.json({ id: orderId, amountLkr }, { status: 201 });
  } catch (error) {
    if (error instanceof AdNotOwnedError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof AdNotActiveError ||
      error instanceof InvalidListingProductError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
