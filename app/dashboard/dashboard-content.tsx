"use client";

import ActivityDialog from "@/components/activity-dialog";
import ClientDialog from "@/components/client-dialog";
import ProjectDialog from "@/components/project-dialog";
import TimeEntryDialog from "@/components/time-entry-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Activity, Client, Project, User } from "@/lib/types";
import { downloadCSV, generateClientCSV } from "@/lib/utils/csv-export";
import {
  calculateEarnings,
  formatCurrency,
  formatDuration,
  getEffectiveHourlyRate,
} from "@/lib/utils/time";
import {
  BarChart3,
  Clock,
  Download,
  LogOut,
  Plus,
  Settings,
  Trees,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardContentProps {
  user: User;
  initialClients: Client[];
}

export default function DashboardContent({
  user,
  initialClients,
}: DashboardContentProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const refreshClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select(
        `
        *,
        projects (
          *,
          activities (
            *,
            time_entries (*)
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setClients(data);
  };

  const getTotalTimeForClient = (client: Client): number => {
    return (
      client.projects?.reduce((total, project) => {
        return (
          total +
          (project.activities?.reduce((projectTotal, activity) => {
            return (
              projectTotal +
              (activity.time_entries?.reduce((activityTotal, entry) => {
                return activityTotal + (entry.duration || 0);
              }, 0) || 0)
            );
          }, 0) || 0)
        );
      }, 0) || 0
    );
  };

  const getTotalEarningsForClient = (client: Client): number => {
    return (
      client.projects?.reduce((total, project) => {
        return (
          total +
          (project.activities?.reduce((projectTotal, activity) => {
            const activityTotal =
              activity.time_entries?.reduce((entryTotal, entry) => {
                const effectiveRate = getEffectiveHourlyRate({
                  activity,
                  project,
                });
                return (
                  entryTotal +
                  calculateEarnings(entry.duration || 0, effectiveRate)
                );
              }, 0) || 0;
            return projectTotal + activityTotal;
          }, 0) || 0)
        );
      }, 0) || 0
    );
  };

  const getRunningActivity = (): Activity | null => {
    for (const client of clients) {
      for (const project of client.projects || []) {
        for (const activity of project.activities || []) {
          const runningEntry = activity.time_entries?.find(
            (entry) => entry.is_running
          );
          if (runningEntry) return activity;
        }
      }
    }
    return null;
  };

  const runningActivity = getRunningActivity();
  const allProjects = clients.flatMap((client) => client.projects || []);

  const handleExportClient = async (client: Client) => {
    try {
      const { data } = await supabase
        .from("clients")
        .select(
          `
        *,
        projects (
          *,
          activities (
            *,
            time_entries (*)
          )
        )
      `
        )
        .eq("id", client.id)
        .single();

      if (data) {
        const csvContent = generateClientCSV(data);
        const filename = `${client.name
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_report_${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(csvContent, filename);
      }
    } catch (error) {
      console.error("Error exporting client data:", error);
      alert("Failed to export client data");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100">
      {/* Header */}
      <header className="border-b border-forest-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full forest-gradient">
                <Trees className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-forest-800">
                  Forest Timer
                </h1>
                <p className="text-sm text-forest-600">
                  Welcome back, {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/analytics">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-forest-600 hover:text-forest-800"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-forest-600 hover:text-forest-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-forest-600 hover:text-forest-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Running Timer Alert */}
      {runningActivity && (
        <div className="bg-forest-500 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full timer-pulse" />
              <span className="text-sm font-medium">
                Timer running for: {runningActivity.name}
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => setShowClientDialog(true)}
            className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            New Client
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTimeDialog(true)}
            className="border-forest-300 text-forest-700 hover:bg-forest-50"
          >
            <Clock className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="forest-card hover:shadow-xl transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: client.color }}
                    />
                    <CardTitle className="text-forest-800">
                      {client.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-forest-100 text-forest-700"
                  >
                    {client.projects?.length || 0} projects
                  </Badge>
                </div>
                {client.description && (
                  <CardDescription className="text-forest-600">
                    {client.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-forest-600">Total Time:</span>
                    <div className="font-medium text-forest-800">
                      {formatDuration(getTotalTimeForClient(client))}
                    </div>
                  </div>
                  <div>
                    <span className="text-forest-600">Earnings:</span>
                    <div className="font-medium text-forest-800">
                      {formatCurrency(getTotalEarningsForClient(client))}
                    </div>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-forest-600">Hourly Rate: </span>
                  <span className="font-medium text-forest-800">
                    {formatCurrency(client.hourly_rate)}/hr
                  </span>
                </div>

                {/* Recent Projects */}
                <div className="space-y-2">
                  {client.projects?.slice(0, 2).map((project) => (
                    <div
                      key={project.id}
                      className="p-2 rounded bg-forest-50/50 border border-forest-200/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-forest-800">
                          {project.name}
                        </span>
                        <Link href={`/project/${project.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-forest-600"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  {(client.projects?.length || 0) > 2 && (
                    <p className="text-xs text-forest-500 text-center">
                      +{(client.projects?.length || 0) - 2} more projects
                    </p>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedClient(client);
                      setShowProjectDialog(true);
                    }}
                    className="flex-1 border-forest-300 text-forest-700 hover:bg-forest-50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Project
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportClient(client)}
                    className="border-forest-300 text-forest-700 hover:bg-forest-50"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {clients.length === 0 && (
            <Card className="forest-card col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-forest-400 mb-4" />
                <h3 className="text-lg font-medium text-forest-800 mb-2">
                  No clients yet
                </h3>
                <p className="text-forest-600 text-center mb-4">
                  Create your first client to start organizing your projects and
                  tracking time.
                </p>
                <Button
                  onClick={() => setShowClientDialog(true)}
                  className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create Client
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ClientDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onSuccess={refreshClients}
      />

      <ProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        client={selectedClient}
        onSuccess={refreshClients}
      />

      <ActivityDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        project={selectedProject}
        onSuccess={refreshClients}
      />

      <TimeEntryDialog
        open={showTimeDialog}
        onOpenChange={setShowTimeDialog}
        projects={allProjects}
        onSuccess={refreshClients}
      />
    </div>
  );
}
