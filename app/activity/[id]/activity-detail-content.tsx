"use client";

import ActivityDeleteDialog from "@/components/activity-delete-dialog";
import CSVImportDialog from "@/components/csv-import-dialog";
import CSVTemplatesDialog from "@/components/csv-templates-dialog";
import ManualTimeEntryDialog from "@/components/manual-time-entry-dialog";
import TimeEntryEditDialog from "@/components/time-entry-edit-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimer } from "@/hooks/use-timer";
import { createClient } from "@/lib/supabase/client";
import type { Activity, TimeEntry, User } from "@/lib/types";
import {
  calculateEarnings,
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
  getEffectiveHourlyRate,
} from "@/lib/utils/time";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Edit,
  FileText,
  MoreHorizontal,
  Play,
  Plus,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ActivityDetailContentProps {
  user: User;
  activity: Activity & {
    project: {
      id: string;
      name: string;
      color: string;
      hourly_rate?: number;
      client: {
        id: string;
        name: string;
        hourly_rate: number;
      };
    };
    time_entries: TimeEntry[];
  };
}

export default function ActivityDetailContent({
  user,
  activity: initialActivity,
}: ActivityDetailContentProps) {
  const [activity, setActivity] = useState(initialActivity);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const { isRunning, seconds, startTimer, stopTimer } = useTimer({
    activityId: activity.id,
    onUpdate: refreshActivity,
  });

  async function refreshActivity() {
    const { data } = await supabase
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
      .eq("id", activity.id)
      .eq("user_id", user.id)
      .single();

    if (data) setActivity(data);
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return;

    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw error;
      await refreshActivity();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    }
  };

  const handleDeleteActivity = () => {
    setShowDeleteDialog(true);
  };

  const handleActivityDeleted = () => {
    // Navigate back to project page after successful deletion
    router.push(`/project/${activity.project.id}`);
  };

  const getTotalTime = (): number => {
    const completedTime = activity.time_entries
      .filter((entry) => !entry.is_running)
      .reduce((total, entry) => total + (entry.duration || 0), 0);
    return completedTime + (isRunning ? seconds : 0);
  };

  const getTotalEarnings = (): number => {
    const effectiveRate = getEffectiveHourlyRate({
      activity,
      project: activity.project,
    });
    return calculateEarnings(getTotalTime(), effectiveRate);
  };

  const effectiveRate = getEffectiveHourlyRate({
    activity,
    project: activity.project,
  });
  const totalTime = getTotalTime();
  const totalEarnings = getTotalEarnings();

  // Sort entries by start time (newest first)
  const sortedEntries = [...activity.time_entries].sort(
    (a, b) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100">
      {/* Header */}
      <header className="border-b border-forest-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/project/${activity.project.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-forest-600 hover:text-forest-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-forest-800">
                  {activity.name}
                </h1>
                <p className="text-forest-600">
                  {activity.project.client.name} • {activity.project.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CSVTemplatesDialog>
                <Button
                  variant="outline"
                  className="border-forest-300 text-forest-700 hover:bg-forest-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV Templates
                </Button>
              </CSVTemplatesDialog>
              <Button
                onClick={() => setShowCSVImportDialog(true)}
                variant="outline"
                className="border-forest-300 text-forest-700 hover:bg-forest-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                onClick={() => setShowManualDialog(true)}
                variant="outline"
                className="border-forest-300 text-forest-700 hover:bg-forest-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
              <Button
                onClick={isRunning ? stopTimer : startTimer}
                className={
                  isRunning
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                }
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Timer
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-forest-300 text-forest-700 hover:bg-forest-50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteActivity}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Activity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Activity Info */}
        {activity.description && (
          <Card className="forest-card mb-8">
            <CardContent className="pt-6">
              <p className="text-forest-700">{activity.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
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
              <DollarSign className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatCurrency(effectiveRate)}
              </div>
              <p className="text-xs text-forest-600">
                {activity.hourly_rate
                  ? "Activity rate"
                  : activity.project.hourly_rate
                  ? "Project rate"
                  : "Client rate"}
              </p>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Sessions
              </CardTitle>
              <Clock className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {activity.time_entries.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries */}
        <Card className="forest-card">
          <CardHeader>
            <CardTitle className="text-forest-800">Time Entries</CardTitle>
            <CardDescription className="text-forest-600">
              All recorded time sessions for this activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg bg-forest-50/50 border border-forest-200/50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-forest-800">
                        {formatDate(entry.start_time)} at{" "}
                        {formatTime(entry.start_time)}
                      </span>
                      {entry.is_running && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Running
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-forest-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {entry.is_running
                          ? `${formatDuration(
                              entry.duration || 0
                            )} + ${formatDuration(seconds)} (running)`
                          : formatDuration(entry.duration || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        {formatCurrency(
                          calculateEarnings(
                            entry.is_running
                              ? (entry.duration || 0) + seconds
                              : entry.duration || 0,
                            effectiveRate
                          )
                        )}
                      </span>
                    </div>
                    {entry.end_time && (
                      <span>
                        {formatTime(entry.start_time)} -{" "}
                        {formatTime(entry.end_time)}
                      </span>
                    )}
                  </div>

                  {entry.description && (
                    <p className="text-sm text-forest-500 mt-2">
                      {entry.description}
                    </p>
                  )}
                </div>

                {!entry.is_running && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditEntry(entry)}
                      className="text-forest-600 hover:text-forest-800"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {activity.time_entries.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-forest-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-forest-800 mb-2">
                  No time entries yet
                </h3>
                <p className="text-forest-600 mb-4">
                  Start tracking time or add a manual entry.
                </p>
                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={startTimer}
                    className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                  <Button
                    onClick={() => setShowManualDialog(true)}
                    variant="outline"
                    className="border-forest-300 text-forest-700 hover:bg-forest-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Entry
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <TimeEntryEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        entry={selectedEntry}
        onSuccess={refreshActivity}
      />

      <ManualTimeEntryDialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
        activityId={activity.id}
        onSuccess={refreshActivity}
      />

      <CSVImportDialog
        open={showCSVImportDialog}
        onOpenChange={setShowCSVImportDialog}
        activityId={activity.id}
        onSuccess={refreshActivity}
      />

      <ActivityDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        activity={activity}
        onSuccess={handleActivityDeleted}
      />
    </div>
  );
}
