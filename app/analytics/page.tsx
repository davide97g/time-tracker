import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AnalyticsContent from "./analytics-content"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch analytics data
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select(`
      *,
      activity:activities (
        *,
        project:projects (*)
      )
    `)
    .eq("user_id", user.id)
    .not("end_time", "is", null)
    .order("start_time", { ascending: false })

  return <AnalyticsContent user={user} timeEntries={timeEntries || []} />
}
