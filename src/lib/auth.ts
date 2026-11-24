import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's Supabase client, or a redirect to the login page. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
