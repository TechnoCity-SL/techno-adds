/**
 * Client-safe: cloud name isn't a secret (it's visible in every resulting
 * image URL anyway), only CLOUDINARY_API_SECRET is server-only.
 */
export function buildImageUrl(
  publicId: string,
  transform = "w_800,h_600,c_fill,f_auto,q_auto",
): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}
