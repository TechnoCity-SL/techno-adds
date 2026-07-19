import { NextResponse } from "next/server";
import { otpVerifyRequestSchema } from "@/lib/validation/otp";
import { verifyPhoneOtp } from "@/lib/otp/verify";
import { otpVerifyIpLimiter } from "@/lib/rate-limit/otp";
import { getClientIp, checkLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
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

  return NextResponse.json({ verified: true });
}
