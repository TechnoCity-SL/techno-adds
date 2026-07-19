import "server-only";
import { cloudinary } from "./client";

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Signs a Cloudinary upload request server-side so the browser can upload
 * directly to Cloudinary without ever seeing CLOUDINARY_API_SECRET.
 * Call sites (API routes) go through this adapter — never `cloudinary.utils`
 * directly — per CLAUDE.md's "provider adapters, not vendor lock-in" rule.
 */
export function createUploadSignature(params: {
  folder: string;
}): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: params.folder };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: params.folder,
  };
}
