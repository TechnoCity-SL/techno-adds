import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validation/reports";
import { createReport, InvalidTargetError } from "@/lib/reports/create-report";
import { reportLimiter } from "@/lib/rate-limit/reports";
import { checkLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = await checkLimit(reportLimiter, authData.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many reports submitted. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const id = await createReport(
      authData.user.id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.reason,
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidTargetError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
