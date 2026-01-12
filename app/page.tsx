import LoginPageClient from "@/components/login-page-client";
import GoogleSignInButton from "@/components/google-sign-in-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: { reason?: string; logged_out?: string };
}) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <LoginPageClient reason="auth_not_configured" loggedOut={false}>
        <div className="mt-10">
          <GoogleSignInButton />
        </div>
      </LoginPageClient>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <LoginPageClient
      reason={searchParams.reason ?? null}
      loggedOut={searchParams.logged_out === "1"}
    >
      <div className="mt-10">
        <GoogleSignInButton />
      </div>
    </LoginPageClient>
  );
}
