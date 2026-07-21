import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db/postgres-client";
import { eq } from "drizzle-orm";
import { listPhoneNumbers } from "@/lib/otp/link-phone";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { BottomNavBar } from "@/components/organisms/BottomNavBar";
import { AccountSettingsForm } from "@/components/organisms/AccountSettingsForm";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/account");

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, authData.user.id));
  const phoneNumbers = await listPhoneNumbers(authData.user.id);

  return (
    <div className="pb-24 md:pb-8">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold">Account Settings</h1>
        <AccountSettingsForm
          initialDisplayName={user?.displayName ?? ""}
          memberSince={user ? new Date(user.createdAt).getFullYear() : null}
          isVerified={phoneNumbers.some((p) => p.isVerified)}
          phoneNumbers={phoneNumbers.map((p) => ({
            id: p.id,
            phoneE164: p.phoneE164,
            isVerified: p.isVerified,
            isHidden: p.isHidden,
          }))}
        />
      </main>
      <BottomNavBar />
    </div>
  );
}
