import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's Supabase client, or a redirect to the login page. */
export async function requireUser() {
  // Signed-in pages are per request; Supabase reads the clock while loading the session.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
