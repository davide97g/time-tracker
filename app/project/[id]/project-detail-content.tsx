"use client";

import ActivityDialog from "@/components/activity-dialog";
import CSVImportDialog from "@/components/csv-import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTimer } from "@/hooks/use-timer";
import { createClient } from "@/lib/supabase/client";
import type { Activity, Project, User } from "@/lib/types";
import { downloadCSV, generateProjectCSV } from "@/lib/utils/csv-export";
import {
  calculateEarnings,
  formatCurrency,
  formatDate,
  formatDuration,
  getEffectiveHourlyRate,
} from "@/lib/utils/time";
import {
  ActivityIcon,
  ArrowLeft,
  Clock,
  DollarSign,
  Download,
  Play,
  Plus,
  Square,
  TrendingUp,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface ProjectDetailContentProps {
  user: User;
  project: Project & {
    client: {
      id: string;
      name: string;
      hourly_rate: number;
      color: string;
    };
    activities: (Activity & {
      time_entries: Array<{
        id: string;
        start_time: string;
        end_time?: string;
        duration?: number;
        is_running: boolean;
      }>;
    })[];
  };
}

export default function ProjectDetailContent({
  user,
  project: initialProject,
}: ProjectDetailContentProps) {
  const [project, setProject] = useState(initialProject);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const supabase = createClient();

  const refreshProject = async () => {
    const { data } = await supabase
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
      .eq("id", project.id)
      .eq("user_id", user.id)
      .single();

    if (data) setProject(data);
  };

  const getTotalTime = (): number => {
    return project.activities.reduce((total, activity) => {
      return (
        total +
        (activity.time_entries?.reduce((activityTotal, entry) => {
          return activityTotal + (entry.duration || 0);
        }, 0) || 0)
      );
    }, 0);
  };

  const getTotalEarnings = (): number => {
    return project.activities.reduce((total, activity) => {
      const activityTotal =
        activity.time_entries?.reduce((entryTotal, entry) => {
          const effectiveRate = getEffectiveHourlyRate({
            activity,
            project,
          });
          return (
            entryTotal + calculateEarnings(entry.duration || 0, effectiveRate)
          );
        }, 0) || 0;
      return total + activityTotal;
    }, 0);
  };

  const getActivityStats = () => {
    return project.activities
      .map((activity) => {
        const totalTime =
          activity.time_entries?.reduce(
            (total, entry) => total + (entry.duration || 0),
            0
          ) || 0;
        const effectiveRate = getEffectiveHourlyRate({ activity, project });
        const earnings = calculateEarnings(totalTime, effectiveRate);

        return {
          name: activity.name,
          time: totalTime,
          earnings,
          sessions: activity.time_entries?.length || 0,
          rate: effectiveRate,
        };
      })
      .sort((a, b) => b.time - a.time);
  };

  const getDailyStats = () => {
    const dailyData = new Map();

    project.activities.forEach((activity) => {
      activity.time_entries?.forEach((entry) => {
        if (!entry.end_time) return;

        const date = formatDate(entry.start_time);
        if (!dailyData.has(date)) {
          dailyData.set(date, { date, time: 0, earnings: 0 });
        }

        const dayData = dailyData.get(date);
        const effectiveRate = getEffectiveHourlyRate({ activity, project });
        dayData.time += entry.duration || 0;
        dayData.earnings += calculateEarnings(
          entry.duration || 0,
          effectiveRate
        );
      });
    });

    return Array.from(dailyData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getRunningActivity = (): Activity | null => {
    for (const activity of project.activities) {
      const runningEntry = activity.time_entries?.find(
        (entry) => entry.is_running
      );
      if (runningEntry) return activity;
    }
    return null;
  };

  const handleExportProject = async () => {
    try {
      const csvContent = generateProjectCSV(project);
      const filename = `${project.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_report_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error("Error exporting project data:", error);
      alert("Failed to export project data");
    }
  };

  const totalTime = getTotalTime();
  const totalEarnings = getTotalEarnings();
  const activityStats = getActivityStats();
  const dailyStats = getDailyStats();
  const runningActivity = getRunningActivity();
  const effectiveRate = project.hourly_rate ?? project.client.hourly_rate;

  const COLORS = [
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#166534",
    "#059669",
    "#0d9488",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100">
      {/* Header */}
      <header className="border-b border-forest-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-forest-600 hover:text-forest-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-forest-800">
                    {project.name}
                  </h1>
                  <p className="text-forest-600">{project.client.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowCSVImportDialog(true)}
                variant="outline"
                className="border-forest-300 text-forest-700 hover:bg-forest-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                onClick={handleExportProject}
                variant="outline"
                className="border-forest-300 text-forest-700 hover:bg-forest-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => setShowActivityDialog(true)}
                className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
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
        {/* Project Info */}
        {project.description && (
          <Card className="forest-card mb-8">
            <CardContent className="pt-6">
              <p className="text-forest-700">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Total Time
              </CardTitle>
              <Clock className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatDuration(totalTime)}
              </div>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatCurrency(totalEarnings)}
              </div>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Hourly Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatCurrency(effectiveRate)}
              </div>
              <p className="text-xs text-forest-600">
                {project.hourly_rate ? "Project rate" : "Client rate"}
              </p>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Activities
              </CardTitle>
              <ActivityIcon className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {project.activities.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Daily Progress */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">Daily Progress</CardTitle>
              <CardDescription className="text-forest-600">
                Time and earnings by day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  time: { label: "Time", color: "#22c55e" },
                  earnings: { label: "Earnings", color: "#16a34a" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string) => [
                        name === "time"
                          ? formatDuration(value)
                          : formatCurrency(value),
                        name === "time" ? "Time" : "Earnings",
                      ]}
                    />
                    <Bar dataKey="time" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Activity Distribution */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                Activity Distribution
              </CardTitle>
              <CardDescription className="text-forest-600">
                Time allocation by activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  time: { label: "Time", color: "#22c55e" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="time"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {activityStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value: number) => [
                        formatDuration(value),
                        "Time",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activities List */}
        <Card className="forest-card">
          <CardHeader>
            <CardTitle className="text-forest-800">Activities</CardTitle>
            <CardDescription className="text-forest-600">
              Track time for individual activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                project={project}
                onUpdate={refreshProject}
              />
            ))}

            {project.activities.length === 0 && (
              <div className="text-center py-8">
                <ActivityIcon className="h-12 w-12 text-forest-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-forest-800 mb-2">
                  No activities yet
                </h3>
                <p className="text-forest-600 mb-4">
                  Add your first activity to start tracking time.
                </p>
                <Button
                  onClick={() => setShowActivityDialog(true)}
                  className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <ActivityDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        project={project}
        onSuccess={refreshProject}
      />
      <CSVImportDialog
        open={showCSVImportDialog}
        onOpenChange={setShowCSVImportDialog}
        project={project}
        onSuccess={refreshProject}
      />
    </div>
  );
}

function ActivityCard({
  activity,
  project,
  onUpdate,
}: {
  activity: Activity & {
    time_entries?: Array<{
      id: string;
      duration?: number;
      is_running: boolean;
    }>;
  };
  project: Project & { client: { hourly_rate: number } };
  onUpdate: () => void;
}) {
  const { isRunning, seconds, startTimer, stopTimer } = useTimer({
    activityId: activity.id,
    onUpdate,
  });

  const totalTime =
    activity.time_entries?.reduce(
      (total, entry) => total + (entry.duration || 0),
      0
    ) || 0;
  const currentTime = isRunning ? seconds : 0;
  const displayTime = totalTime + currentTime;
  const effectiveRate = getEffectiveHourlyRate({ activity, project });
  const earnings = calculateEarnings(displayTime, effectiveRate);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-forest-50/50 border border-forest-200/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Link href={`/activity/${activity.id}`}>
            <h4 className="text-sm font-medium text-forest-800 truncate hover:text-forest-600 cursor-pointer">
              {activity.name}
            </h4>
          </Link>
          {activity.hourly_rate && (
            <Badge
              variant="secondary"
              className="bg-forest-100 text-forest-700 text-xs"
            >
              ${activity.hourly_rate}/hr
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4 text-xs text-forest-600">
          <span>{formatDuration(displayTime)}</span>
          <span>{formatCurrency(earnings)}</span>
          <span>{activity.time_entries?.length || 0} sessions</span>
        </div>
        {activity.description && (
          <p className="text-xs text-forest-500 mt-1 truncate">
            {activity.description}
          </p>
        )}
      </div>

      <Button
        size="sm"
        variant={isRunning ? "destructive" : "default"}
        onClick={isRunning ? stopTimer : startTimer}
        className={
          isRunning
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
        }
      >
        {isRunning ? (
          <Square className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
