import { z } from "zod";

const SRI_LANKA_MOBILE_LOCAL = /^07\d{8}$/; // e.g. 0771234567
const SRI_LANKA_E164_DIGITS = /^94\d{9}$/; // e.g. 94771234567
const E164 = /^\+[1-9]\d{7,14}$/;

/** Accepts local (07XXXXXXXX), bare-country-code (94XXXXXXXXX), or E.164 (+94XXXXXXXXX) input. */
export function normalizeSriLankaPhone(input: string): string | null {
  const trimmed = input.trim().replace(/[\s-]/g, "");
  if (E164.test(trimmed)) return trimmed;
  if (SRI_LANKA_E164_DIGITS.test(trimmed)) return `+${trimmed}`;
  if (SRI_LANKA_MOBILE_LOCAL.test(trimmed)) return `+94${trimmed.slice(1)}`;
  return null;
}

export const phoneInputSchema = z.string().transform((val, ctx) => {
  const normalized = normalizeSriLankaPhone(val);
  if (!normalized) {
    ctx.addIssue({
      code: "custom",
      message: "Not a valid Sri Lankan mobile number",
    });
    return z.NEVER;
  }
  return normalized;
});
