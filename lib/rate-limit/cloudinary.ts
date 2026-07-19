import "server-only";
import { createRateLimiter } from "./index";

export const cloudinarySignLimiter = createRateLimiter({
  limit: 30,
  windowSeconds: 60 * 60,
  prefix: "ratelimit:cloudinary-sign",
});
