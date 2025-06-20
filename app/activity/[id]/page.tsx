import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ActivityDetailContent from "./activity-detail-content";

interface ActivityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { id } = await params;
  // Fetch activity with all related data
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select(
      `
      *,
      project:projects (
        *,
        client:clients (*)
      ),
      time_entries (*)
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (activityError || !activity) {
    redirect("/dashboard");
  }

  return <ActivityDetailContent user={user} activity={activity} />;
}
