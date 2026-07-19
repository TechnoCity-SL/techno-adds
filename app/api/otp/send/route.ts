import { NextResponse } from "next/server";
import { otpSendRequestSchema } from "@/lib/validation/otp";
import { sendPhoneOtp } from "@/lib/otp/send";
import { otpSendPhoneLimiter, otpSendIpLimiter } from "@/lib/rate-limit/otp";
import { getClientIp, checkLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = otpSendRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { phone } = parsed.data;
  const ip = getClientIp(request);

  const [phoneLimit, ipLimit] = await Promise.all([
    checkLimit(otpSendPhoneLimiter, phone),
    checkLimit(otpSendIpLimiter, ip),
  ]);

  if (!phoneLimit.success || !ipLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  try {
    const { expiresAt } = await sendPhoneOtp(phone);
    return NextResponse.json({ sent: true, expiresAt });
  } catch (error) {
    console.error("OTP send failed:", error);
    return NextResponse.json(
      { error: "Failed to send verification code." },
      { status: 502 },
    );
  }
}
