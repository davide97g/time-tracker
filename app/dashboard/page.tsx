import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardContent from "./dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch user's clients with projects and activities
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      projects (
        *,
        activities (
          *,
          time_entries (*)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardContent user={user} initialClients={clients || []} />
}
