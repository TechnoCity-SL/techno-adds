import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/molecules/BackButton";
import { VerifyPhoneForm } from "@/components/organisms/VerifyPhoneForm";

export default async function VerifyPhonePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/account/verify-phone");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-1 px-2 py-2">
        <BackButton />
        <span className="text-primary text-lg font-bold">TechnoAds</span>
      </header>
      <VerifyPhoneForm />
    </div>
  );
}
