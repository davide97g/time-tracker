import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectDetailContent from "./project-detail-content";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch project with all related data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:clients (*),
      activities (
        *,
        time_entries (*)
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    redirect("/dashboard");
  }

  return <ProjectDetailContent user={user} project={project} />;
}
