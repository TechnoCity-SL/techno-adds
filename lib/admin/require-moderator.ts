import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isModerator } from "./moderation";

export async function requireModerator(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const moderator = await isModerator(data.user.id);
  if (!moderator) return null;

  return { userId: data.user.id };
}
