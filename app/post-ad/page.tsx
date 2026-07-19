import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostAdWizard } from "@/components/organisms/PostAdWizard";

export default async function PostAdPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/post-ad");
  }

  return <PostAdWizard />;
}
