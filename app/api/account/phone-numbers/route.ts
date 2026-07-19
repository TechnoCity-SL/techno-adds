import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { otpVerifyRequestSchema } from "@/lib/validation/otp";
import { verifyPhoneOtp } from "@/lib/otp/verify";
import {
  linkVerifiedPhoneNumber,
  listPhoneNumbers,
} from "@/lib/otp/link-phone";
import { otpVerifyIpLimiter } from "@/lib/rate-limit/otp";
import { getClientIp, checkLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const phoneNumbers = await listPhoneNumbers(authData.user.id);
  return NextResponse.json({ phoneNumbers });
}

/**
 * Verifies an OTP code and, on success, attaches that phone number to the
 * CURRENT session's user — the user id always comes from the server-side
 * session (supabase.auth.getUser()), never from the request body, per
 * CLAUDE.md rule #4 ("never trust a client-submitted user_id for ownership").
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = otpVerifyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const ipLimit = await checkLimit(otpVerifyIpLimiter, ip);
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const { phone, code } = parsed.data;
  const result = await verifyPhoneOtp(phone, code);

  if (!result.ok) {
    return NextResponse.json(
      { verified: false, reason: result.reason },
      { status: 400 },
    );
  }

  const phoneNumber = await linkVerifiedPhoneNumber(authData.user.id, phone);
  return NextResponse.json({ verified: true, phoneNumber });
}
