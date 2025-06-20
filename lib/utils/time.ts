import { Activity, Client, Project } from "../types";

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function calculateEarnings(
  durationInSeconds: number,
  hourlyRate: number
): number {
  const hours = durationInSeconds / 3600;
  return hours * hourlyRate;
}

export function getEffectiveHourlyRate({
  activity,
  project,
  client,
}: {
  activity: Activity;
  project: Project;
  client?: Client;
}): number {
  if (activity.hourly_rate) {
    return activity.hourly_rate;
  } else if (project.hourly_rate) {
    return project.hourly_rate;
  } else if (project.client?.hourly_rate) {
    return project.client.hourly_rate;
  }
  return client?.hourly_rate || 0;
}
