export interface CSVTemplate {
  name: string;
  description: string;
  filename: string;
  headers: string[];
  sampleData: string[][];
  instructions: string[];
}

export const CSV_TEMPLATES: CSVTemplate[] = [
  {
    name: "Project Import - Full Data",
    description:
      "Import time entries with start/end times, activities, and descriptions for a project",
    filename: "project_import_full_template.csv",
    headers: ["Date", "Activity", "Start Time", "End Time", "Description"],
    sampleData: [
      [
        "2024-01-15",
        "Development",
        "2024-01-15 09:00:00",
        "2024-01-15 12:30:00",
        "Working on user authentication",
      ],
      [
        "2024-01-15",
        "Testing",
        "2024-01-15 14:00:00",
        "2024-01-15 16:00:00",
        "Testing login functionality",
      ],
      [
        "2024-01-16",
        "Development",
        "2024-01-16 10:00:00",
        "2024-01-16 11:30:00",
        "Bug fixes and improvements",
      ],
      [
        "2024-01-16",
        "Documentation",
        "2024-01-16 15:00:00",
        "2024-01-16 17:00:00",
        "Writing API documentation",
      ],
    ],
    instructions: [
      "Date column is optional but helps with organization",
      "Activity column will create new activities if they don't exist",
      "Start Time and End Time should be in YYYY-MM-DD HH:MM:SS format",
      "Description column is optional but recommended for billing",
      "Times can also be in other formats like MM/DD/YYYY HH:MM AM/PM",
    ],
  },
  {
    name: "Project Import - Duration Based",
    description:
      "Import time entries using duration instead of start/end times",
    filename: "project_import_duration_template.csv",
    headers: ["Date", "Activity", "Duration", "Description"],
    sampleData: [
      ["2024-01-15", "Development", "3h 30m", "Working on user authentication"],
      ["2024-01-15", "Testing", "2:00", "Testing login functionality"],
      ["2024-01-16", "Development", "1.5h", "Bug fixes and improvements"],
      ["2024-01-16", "Documentation", "2h", "Writing API documentation"],
      ["2024-01-17", "Meeting", "45m", "Client review meeting"],
    ],
    instructions: [
      "Duration can be in various formats: '3h 30m', '2:30', '2.5h', '150m', or just '150' (minutes)",
      "Activity column will create new activities if they don't exist",
      "Date column helps organize entries chronologically",
      "Description column is optional but useful for detailed billing",
      "Start time will be set to import time, end time calculated from duration",
    ],
  },
  {
    name: "Activity Import - Time Range",
    description:
      "Import multiple time entries for a single activity with start/end times",
    filename: "activity_import_timerange_template.csv",
    headers: ["Start Time", "End Time", "Description"],
    sampleData: [
      [
        "2024-01-15 09:00:00",
        "2024-01-15 12:30:00",
        "Initial setup and configuration",
      ],
      [
        "2024-01-15 14:00:00",
        "2024-01-15 16:00:00",
        "Core functionality implementation",
      ],
      ["2024-01-16 10:00:00", "2024-01-16 11:30:00", "Bug fixes and testing"],
      [
        "2024-01-16 15:00:00",
        "2024-01-16 17:00:00",
        "Code review and optimization",
      ],
    ],
    instructions: [
      "Perfect for importing time entries to a specific activity",
      "Start Time and End Time should be in YYYY-MM-DD HH:MM:SS format",
      "Description column is optional but recommended",
      "All entries will be assigned to the selected activity",
      "Times can be in various formats including MM/DD/YYYY HH:MM AM/PM",
    ],
  },
  {
    name: "Activity Import - Duration Only",
    description: "Import time entries for a single activity using durations",
    filename: "activity_import_duration_template.csv",
    headers: ["Date", "Duration", "Description"],
    sampleData: [
      ["2024-01-15", "3h 30m", "Initial setup and configuration"],
      ["2024-01-15", "2:00", "Core functionality implementation"],
      ["2024-01-16", "1.5h", "Bug fixes and testing"],
      ["2024-01-16", "2h", "Code review and optimization"],
      ["2024-01-17", "45m", "Final testing and deployment"],
    ],
    instructions: [
      "Simple format for importing duration-based entries",
      "Duration supports: '3h 30m', '2:30', '2.5h', '150m', or '150' (minutes)",
      "Date column helps organize entries (optional)",
      "Description column is optional but useful for tracking work details",
      "All entries will be assigned to the selected activity",
    ],
  },
  {
    name: "Freelancer Timesheet",
    description:
      "Template for freelancers tracking multiple clients and projects",
    filename: "freelancer_timesheet_template.csv",
    headers: [
      "Date",
      "Client",
      "Project",
      "Activity",
      "Start Time",
      "End Time",
      "Hourly Rate",
      "Description",
    ],
    sampleData: [
      [
        "2024-01-15",
        "Acme Corp",
        "Website Redesign",
        "Design",
        "09:00",
        "12:30",
        "75",
        "Creating wireframes",
      ],
      [
        "2024-01-15",
        "Tech Startup",
        "Mobile App",
        "Development",
        "14:00",
        "18:00",
        "85",
        "API integration",
      ],
      [
        "2024-01-16",
        "Acme Corp",
        "Website Redesign",
        "Development",
        "09:00",
        "17:00",
        "75",
        "Frontend coding",
      ],
      [
        "2024-01-16",
        "Local Business",
        "SEO Audit",
        "Analysis",
        "19:00",
        "21:00",
        "60",
        "Keyword research",
      ],
    ],
    instructions: [
      "Comprehensive template for freelancers managing multiple clients",
      "Client and Project columns help organize work",
      "Hourly Rate column allows different rates per project",
      "Time can be in 24-hour format (HH:MM) or 12-hour format (HH:MM AM/PM)",
      "Note: You'll need to import this to individual projects, not all at once",
    ],
  },
  {
    name: "Weekly Timesheet",
    description: "Standard weekly timesheet format with daily breakdowns",
    filename: "weekly_timesheet_template.csv",
    headers: [
      "Day",
      "Activity",
      "Morning (Hours)",
      "Afternoon (Hours)",
      "Evening (Hours)",
      "Notes",
    ],
    sampleData: [
      ["Monday", "Development", "4", "3.5", "0", "Working on new features"],
      ["Monday", "Meetings", "0", "0.5", "0", "Daily standup"],
      ["Tuesday", "Development", "3", "4", "1", "Bug fixes and testing"],
      ["Tuesday", "Documentation", "1", "0", "0", "Updating user guides"],
      [
        "Wednesday",
        "Development",
        "4",
        "4",
        "0",
        "Code review and refactoring",
      ],
    ],
    instructions: [
      "Traditional weekly timesheet format",
      "Hours are in decimal format (e.g., 3.5 = 3 hours 30 minutes)",
      "You can combine morning, afternoon, and evening hours",
      "Notes column provides context for the work done",
      "Import will convert hours to duration format automatically",
    ],
  },
  {
    name: "Toggl Export Format",
    description: "Compatible with Toggl time tracking export format",
    filename: "toggl_export_template.csv",
    headers: [
      "User",
      "Email",
      "Client",
      "Project",
      "Task",
      "Description",
      "Billable",
      "Start date",
      "Start time",
      "End date",
      "End time",
      "Duration",
    ],
    sampleData: [
      [
        "John Doe",
        "john@example.com",
        "Client A",
        "Project X",
        "Development",
        "Feature implementation",
        "Yes",
        "2024-01-15",
        "09:00:00",
        "2024-01-15",
        "12:30:00",
        "03:30:00",
      ],
      [
        "John Doe",
        "john@example.com",
        "Client A",
        "Project X",
        "Testing",
        "Unit tests",
        "Yes",
        "2024-01-15",
        "14:00:00",
        "2024-01-15",
        "16:00:00",
        "02:00:00",
      ],
      [
        "John Doe",
        "john@example.com",
        "Client B",
        "Project Y",
        "Design",
        "UI mockups",
        "Yes",
        "2024-01-16",
        "10:00:00",
        "2024-01-16",
        "11:30:00",
        "01:30:00",
      ],
    ],
    instructions: [
      "Compatible with Toggl time tracking exports",
      "Task column maps to Activity in Forest Timer",
      "Duration is in HH:MM:SS format",
      "Billable column is informational only",
      "Start/End dates and times are separate columns",
      "User and Email columns are ignored during import",
    ],
  },
  {
    name: "RescueTime Export",
    description: "Compatible with RescueTime detailed export format",
    filename: "rescuetime_export_template.csv",
    headers: [
      "Date",
      "Time Spent (seconds)",
      "Number of People",
      "Activity",
      "Category",
      "Productivity",
    ],
    sampleData: [
      [
        "2024-01-15",
        "12600",
        "1",
        "Visual Studio Code",
        "Software Development",
        "2",
      ],
      [
        "2024-01-15",
        "7200",
        "1",
        "Google Chrome",
        "Communication & Scheduling",
        "0",
      ],
      ["2024-01-15", "5400", "1", "Slack", "Communication & Scheduling", "0"],
      [
        "2024-01-16",
        "14400",
        "1",
        "IntelliJ IDEA",
        "Software Development",
        "2",
      ],
    ],
    instructions: [
      "Compatible with RescueTime detailed activity exports",
      "Time Spent is in seconds",
      "Activity column becomes the activity name",
      "Category and Productivity columns are informational",
      "Duration will be converted from seconds automatically",
      "Useful for importing computer usage data as time entries",
    ],
  },
];

export function generateCSVTemplate(template: CSVTemplate): string {
  const rows = [template.headers, ...template.sampleData];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

export function downloadCSVTemplate(template: CSVTemplate): void {
  const csvContent = generateCSVTemplate(template);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", template.filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
