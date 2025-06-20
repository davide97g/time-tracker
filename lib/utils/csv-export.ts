import type { Activity, Client, Project, TimeEntry } from "@/lib/types";
import {
  calculateEarnings,
  formatDuration,
  getEffectiveHourlyRate,
} from "./time";

export function generateClientCSV(
  client: Client & {
    projects: (Project & {
      activities: (Activity & {
        time_entries: TimeEntry[];
      })[];
    })[];
  }
): string {
  const headers = [
    "Date",
    "Project",
    "Activity",
    "Start Time",
    "End Time",
    "Duration (Hours)",
    "Duration (Formatted)",
    "Hourly Rate",
    "Earnings",
    "Description",
  ];

  const rows: string[][] = [headers];

  client.projects.forEach((project) => {
    project.activities?.forEach((activity) => {
      activity.time_entries
        ?.filter((entry) => entry.end_time) // Only completed entries
        .forEach((entry) => {
          const effectiveRate = getEffectiveHourlyRate({
            activity,
            project,
            client,
          });
          const durationHours = (entry.duration || 0) / 3600;
          const earnings = calculateEarnings(
            entry.duration || 0,
            effectiveRate
          );

          rows.push([
            new Date(entry.start_time).toLocaleDateString(),
            project.name,
            activity.name,
            new Date(entry.start_time).toLocaleString(),
            entry.end_time ? new Date(entry.end_time).toLocaleString() : "",
            durationHours.toFixed(2),
            formatDuration(entry.duration || 0),
            effectiveRate.toString(),
            earnings.toFixed(2),
            entry.description || "",
          ]);
        });
    });
  });

  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function generateProjectCSV(
  project: Project & {
    client: Client;
    activities: (Activity & {
      time_entries: TimeEntry[];
    })[];
  }
): string {
  const headers = [
    "Date",
    "Activity",
    "Start Time",
    "End Time",
    "Duration (Hours)",
    "Duration (Formatted)",
    "Hourly Rate",
    "Earnings",
    "Description",
  ];

  const rows: string[][] = [headers];

  project.activities.forEach((activity) => {
    activity.time_entries
      ?.filter((entry) => entry.end_time) // Only completed entries
      .forEach((entry) => {
        const effectiveRate = getEffectiveHourlyRate({
          activity,
          project,
        });
        const durationHours = (entry.duration || 0) / 3600;
        const earnings = calculateEarnings(entry.duration || 0, effectiveRate);

        rows.push([
          new Date(entry.start_time).toLocaleDateString(),
          activity.name,
          new Date(entry.start_time).toLocaleString(),
          entry.end_time ? new Date(entry.end_time).toLocaleString() : "",
          durationHours.toFixed(2),
          formatDuration(entry.duration || 0),
          effectiveRate.toString(),
          earnings.toFixed(2),
          entry.description || "",
        ]);
      });
  });

  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
