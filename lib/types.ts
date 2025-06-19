export interface Client {
  id: string;
  name: string;
  description?: string;
  hourly_rate: number;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  hourly_rate?: number; // Can override client rate
  client_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
  client?: Client;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  hourly_rate?: number; // Can override project/client rate
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  time_entries?: TimeEntry[];
  project?: Project;
}

export interface TimeEntry {
  id: string;
  activity_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  description?: string;
  is_running: boolean;
  created_at: string;
  updated_at: string;
  activity?: Activity;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

// Helper function to get effective hourly rate
export function getEffectiveHourlyRate(activity: Activity): number {
  return (
    activity.hourly_rate ??
    activity.project?.hourly_rate ??
    activity.project?.client?.hourly_rate ??
    0
  );
}
