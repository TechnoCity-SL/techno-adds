import "server-only";

const AUTH_URL = "https://bsms.hutch.lk/api/login";
const SMS_URL = "https://bsms.hutch.lk/api/sendsms";

interface HutchConfig {
  username: string;
  password: string;
  mask: string;
  campaignName: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// Module-scope cache: the reference implementation this was adapted from
// re-authenticated on every single SMS send. We only re-authenticate when the
// cached bearer token is missing or about to expire.
let cachedToken: CachedToken | null = null;
const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60 * 1000;
const DEFAULT_TOKEN_TTL_MS = 50 * 60 * 1000; // used if the JWT has no readable `exp`

function getConfig(): HutchConfig {
  const {
    HUTCH_SMS_USERNAME,
    HUTCH_SMS_PASSWORD,
    HUTCH_SMS_MASK,
    HUTCH_SMS_CAMPAIGN_NAME,
  } = process.env;
  if (
    !HUTCH_SMS_USERNAME ||
    !HUTCH_SMS_PASSWORD ||
    !HUTCH_SMS_MASK ||
    !HUTCH_SMS_CAMPAIGN_NAME
  ) {
    throw new Error(
      "HUTCH SMS is not configured — set HUTCH_SMS_USERNAME, HUTCH_SMS_PASSWORD, HUTCH_SMS_MASK, HUTCH_SMS_CAMPAIGN_NAME",
    );
  }
  return {
    username: HUTCH_SMS_USERNAME,
    password: HUTCH_SMS_PASSWORD,
    mask: HUTCH_SMS_MASK,
    campaignName: HUTCH_SMS_CAMPAIGN_NAME,
  };
}

function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function authenticate(config: HutchConfig): Promise<string> {
  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-API-VERSION": "v1",
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Hutch authentication failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = await response.json();
  if (!data.accessToken) {
    throw new Error("Hutch authentication response missing accessToken");
  }

  const expiresAt =
    decodeJwtExpiryMs(data.accessToken) ?? Date.now() + DEFAULT_TOKEN_TTL_MS;
  cachedToken = { accessToken: data.accessToken, expiresAt };
  return data.accessToken;
}

async function getAccessToken(config: HutchConfig): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_EXPIRY_SAFETY_MARGIN_MS > Date.now()
  ) {
    return cachedToken.accessToken;
  }
  return authenticate(config);
}

export interface SendSmsResult {
  messageId: string | null;
  status: string;
}

/**
 * Generic SMS-sending interface per CLAUDE.md rule #8 ("provider adapters, not
 * vendor lock-in"). `to` must already be a normalized E.164 phone number —
 * normalization is OTP-domain logic (lib/otp), not this adapter's job. Callers
 * never touch HUTCH's auth/token handling directly, only this function.
 */
export async function sendSms(
  to: string,
  message: string,
): Promise<SendSmsResult> {
  const config = getConfig();
  const accessToken = await getAccessToken(config);

  // Confirmed by direct testing: Hutch's API rejects a leading "+" with
  // BE0006 "Invalid number(s)" — it wants bare digits (country code, no plus).
  // This strip is a Hutch-specific quirk, so it belongs here, not in the
  // E.164 normalization shared by the rest of the app (lib/validation/phone.ts).
  const hutchNumber = to.replace(/^\+/, "");

  const response = await fetch(SMS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-API-VERSION": "v1",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      campaignName: config.campaignName,
      mask: config.mask,
      numbers: hutchNumber,
      content: message,
      deliveryReportRequest: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Hutch SMS send failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = await response.json();
  return {
    messageId: data.messageId ?? data.id ?? null,
    status: data.status ?? "sent",
  };
}
