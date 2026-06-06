import { requireApiActor } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", actor!.userId)
    .single();

  const { data: userData } = await supabase.auth.admin.getUserById(actor!.userId);

  return apiOk({
    actor,
    profile,
    user: userData?.user ? {
      id: userData.user.id,
      email: userData.user.email,
      app_metadata: userData.user.app_metadata,
      user_metadata: userData.user.user_metadata,
    } : null,
  });
}
