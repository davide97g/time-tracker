"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Activity, Project } from "@/lib/types";
import { formatDuration } from "@/lib/utils/time";
import { AlertCircle, FileText, Plus, Upload } from "lucide-react";
import { useCallback, useState } from "react";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project & { activities: Activity[] };
  activityId?: string;
  onSuccess: () => void;
}

interface ParsedCSVRow {
  [key: string]: string;
}

interface MappedTimeEntry {
  activityId: string;
  activityName: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isNewActivity: boolean;
  originalRow: ParsedCSVRow;
}

interface ColumnMapping {
  startTime?: string;
  endTime?: string;
  duration?: string;
  description?: string;
  activity?: string;
}

export default function CSVImportDialog({
  open,
  onOpenChange,
  project,
  activityId,
  onSuccess,
}: CSVImportDialogProps) {
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ParsedCSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedEntries, setMappedEntries] = useState<MappedTimeEntry[]>([]);
  const [newActivities, setNewActivities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isProjectImport = !!project;
  const isActivityImport = !!activityId;

  const resetDialog = () => {
    setStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setMappedEntries([]);
    setNewActivities(new Set());
    setError(null);
  };

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setCsvFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            setError(
              "CSV file must have at least a header row and one data row"
            );
            return;
          }

          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          const data = lines.slice(1).map((line) => {
            const values = line
              .split(",")
              .map((v) => v.trim().replace(/"/g, ""));
            const row: ParsedCSVRow = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            return row;
          });

          setCsvHeaders(headers);
          setCsvData(data);
          setStep(2);
        } catch (err) {
          setError("Failed to parse CSV file. Please check the format.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const handleColumnMappingChange = (
    column: keyof ColumnMapping,
    value: string
  ) => {
    setColumnMapping((prev) => ({
      ...prev,
      [column]: value === "none" ? undefined : value,
    }));
  };

  const handleActivityMapping = (
    rowIndex: number,
    activityName: string,
    isNew = false
  ) => {
    setMappedEntries((prev) => {
      const updated = [...prev];
      if (updated[rowIndex]) {
        updated[rowIndex] = {
          ...updated[rowIndex],
          activityId: isNew ? `new_${activityName}` : activityName,
          activityName,
          isNewActivity: isNew,
        };
      }
      return updated;
    });

    if (isNew) {
      setNewActivities((prev) => new Set([...prev, activityName]));
    }
  };

  const processColumnMapping = () => {
    if (
      !columnMapping.startTime &&
      !columnMapping.endTime &&
      !columnMapping.duration
    ) {
      setError(
        "Please select either start/end time columns or duration column"
      );
      return;
    }

    const entries: MappedTimeEntry[] = csvData.map((row, index) => {
      let startTime: string | undefined;
      let endTime: string | undefined;
      let duration: number | undefined;

      // Parse time data
      if (columnMapping.startTime && columnMapping.endTime) {
        startTime = row[columnMapping.startTime];
        endTime = row[columnMapping.endTime];
      } else if (columnMapping.duration) {
        const durationStr = row[columnMapping.duration];
        // Try to parse duration in various formats (hours, minutes, etc.)
        duration = parseDuration(durationStr);
      }

      const description = columnMapping.description
        ? row[columnMapping.description]
        : undefined;

      let activityName = "";
      let activityId = "";
      let isNewActivity = false;

      if (isActivityImport) {
        // For activity import, use the provided activity ID
        activityId = activityId!;
        activityName = "Current Activity";
      } else if (columnMapping.activity) {
        // For project import, get activity from CSV
        activityName = row[columnMapping.activity] || `Activity ${index + 1}`;
        const existingActivity = project?.activities.find(
          (a) => a.name === activityName
        );
        if (existingActivity) {
          activityId = existingActivity.id;
        } else {
          activityId = `new_${activityName}`;
          isNewActivity = true;
        }
      } else {
        activityName = `Activity ${index + 1}`;
        activityId = `new_${activityName}`;
        isNewActivity = true;
      }

      return {
        activityId,
        activityName,
        startTime,
        endTime,
        duration,
        description,
        isNewActivity,
        originalRow: row,
      };
    });

    setMappedEntries(entries);
    setStep(3);
  };

  const parseDuration = (durationStr: string): number => {
    // Try to parse various duration formats
    const str = durationStr.toLowerCase().trim();

    // Format: "2h 30m" or "2:30"
    const hoursMinutes = str.match(/(\d+)[:h]\s*(\d+)m?/);
    if (hoursMinutes) {
      return (
        Number.parseInt(hoursMinutes[1]) * 3600 +
        Number.parseInt(hoursMinutes[2]) * 60
      );
    }

    // Format: "2.5h" or "2.5 hours"
    const hoursDecimal = str.match(/(\d+\.?\d*)h/);
    if (hoursDecimal) {
      return Math.floor(Number.parseFloat(hoursDecimal[1]) * 3600);
    }

    // Format: "150m" or "150 minutes"
    const minutes = str.match(/(\d+)m/);
    if (minutes) {
      return Number.parseInt(minutes[1]) * 60;
    }

    // Format: just a number (assume minutes)
    const number = Number.parseFloat(str);
    if (!isNaN(number)) {
      return Math.floor(number * 60); // Assume minutes
    }

    return 0;
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create new activities first
      const activitiesToCreate = Array.from(newActivities);
      const createdActivities = new Map<string, string>();

      for (const activityName of activitiesToCreate) {
        const { data: newActivity, error } = await supabase
          .from("activities")
          .insert({
            name: activityName,
            project_id: project?.id || "",
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        createdActivities.set(`new_${activityName}`, newActivity.id);
      }

      // Create time entries
      const timeEntriesToCreate = mappedEntries.map((entry) => {
        let finalActivityId = entry.activityId;
        if (entry.isNewActivity) {
          finalActivityId =
            createdActivities.get(entry.activityId) || entry.activityId;
        }

        let startTime: string;
        let endTime: string | null = null;
        let duration: number;

        if (entry.startTime && entry.endTime) {
          startTime = new Date(entry.startTime).toISOString();
          endTime = new Date(entry.endTime).toISOString();
          duration = Math.floor(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
          );
        } else if (entry.duration) {
          startTime = new Date().toISOString();
          duration = entry.duration;
        } else {
          throw new Error("Invalid time data");
        }

        return {
          activity_id: finalActivityId,
          user_id: user.id,
          start_time: startTime,
          end_time: endTime,
          duration,
          description: entry.description || null,
          is_running: false,
        };
      });

      const { error: entriesError } = await supabase
        .from("time_entries")
        .insert(timeEntriesToCreate);

      if (entriesError) throw entriesError;

      onSuccess();
      onOpenChange(false);
      resetDialog();
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import data");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="h-12 w-12 text-forest-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-forest-800 mb-2">
          Import CSV for {isProjectImport ? project?.name : "Activity"}
        </h3>
        <p className="text-forest-600">
          Upload a CSV file with your time tracking data
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csv-file" className="text-forest-700">
          Select CSV File
        </Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="border-forest-200 focus:border-forest-500"
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-forest-800 mb-2">
          Map CSV Columns
        </h3>
        <p className="text-forest-600 text-sm mb-4">
          Select which columns in your CSV correspond to the required fields
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-forest-700">Start Time Column</Label>
            <Select
              value={columnMapping.startTime || "none"}
              onValueChange={(value) =>
                handleColumnMappingChange("startTime", value)
              }
            >
              <SelectTrigger className="border-forest-200">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {csvHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-forest-700">End Time Column</Label>
            <Select
              value={columnMapping.endTime || "none"}
              onValueChange={(value) =>
                handleColumnMappingChange("endTime", value)
              }
            >
              <SelectTrigger className="border-forest-200">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {csvHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center text-sm text-forest-600">OR</div>

        <div className="space-y-2">
          <Label className="text-forest-700">Duration Column</Label>
          <Select
            value={columnMapping.duration || "none"}
            onValueChange={(value) =>
              handleColumnMappingChange("duration", value)
            }
          >
            <SelectTrigger className="border-forest-200">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {csvHeaders.map((header) => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-forest-500">
            Supports formats: "2h 30m", "2:30", "2.5h", "150m", or just numbers
            (minutes)
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-forest-700">
            Description Column (Optional)
          </Label>
          <Select
            value={columnMapping.description || "none"}
            onValueChange={(value) =>
              handleColumnMappingChange("description", value)
            }
          >
            <SelectTrigger className="border-forest-200">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {csvHeaders.map((header) => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isProjectImport && (
          <div className="space-y-2">
            <Label className="text-forest-700">
              Activity Column (Optional)
            </Label>
            <Select
              value={columnMapping.activity || "none"}
              onValueChange={(value) =>
                handleColumnMappingChange("activity", value)
              }
            >
              <SelectTrigger className="border-forest-200">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {csvHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-forest-500">
              If not selected, activities will be created automatically
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-forest-800 mb-2">
          Preview Import
        </h3>
        <p className="text-forest-600 text-sm mb-4">
          Review the data that will be imported. You can modify activity
          assignments below.
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {mappedEntries.map((entry, index) => (
          <Card key={index} className="forest-card">
            <CardContent className="pt-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-forest-500" />
                    <span className="text-sm font-medium text-forest-800">
                      Entry {index + 1}
                    </span>
                  </div>
                  {entry.isNewActivity && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Activity
                    </Badge>
                  )}
                </div>

                {isProjectImport && (
                  <div className="space-y-2">
                    <Label className="text-forest-700 text-xs">Activity</Label>
                    <div className="flex space-x-2">
                      <Select
                        value={entry.activityId}
                        onValueChange={(value) => {
                          const isExisting = project?.activities.find(
                            (a) => a.id === value
                          );
                          if (isExisting) {
                            handleActivityMapping(
                              index,
                              isExisting.name,
                              false
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="border-forest-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {project?.activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Or create new activity"
                        className="border-forest-200 text-xs"
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleActivityMapping(
                              index,
                              e.target.value.trim(),
                              true
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-forest-600">Time:</span>
                    <div className="text-forest-800">
                      {entry.startTime && entry.endTime
                        ? `${new Date(
                            entry.startTime
                          ).toLocaleString()} - ${new Date(
                            entry.endTime
                          ).toLocaleString()}`
                        : entry.duration
                        ? formatDuration(entry.duration)
                        : "No time data"}
                    </div>
                  </div>
                  <div>
                    <span className="text-forest-600">Activity:</span>
                    <div className="text-forest-800">{entry.activityName}</div>
                  </div>
                </div>

                {entry.description && (
                  <div className="text-xs">
                    <span className="text-forest-600">Description:</span>
                    <div className="text-forest-800">{entry.description}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {newActivities.size > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            New Activities to Create:
          </h4>
          <div className="flex flex-wrap gap-1">
            {Array.from(newActivities).map((activity) => (
              <Badge
                key={activity}
                variant="secondary"
                className="bg-blue-100 text-blue-700"
              >
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-forest-800">
            Import CSV - Step {step} of 3
          </DialogTitle>
          <DialogDescription className="text-forest-600">
            {step === 1 && "Upload your CSV file"}
            {step === 2 && "Map columns and configure import settings"}
            {step === 3 && "Review and confirm the import"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-forest-300 text-forest-700"
                >
                  Back
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-forest-300 text-forest-700"
              >
                Cancel
              </Button>
              {step === 1 && (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!csvFile}
                  className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                >
                  Next
                </Button>
              )}
              {step === 2 && (
                <Button
                  onClick={processColumnMapping}
                  className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                >
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                >
                  {isLoading
                    ? "Importing..."
                    : `Import ${mappedEntries.length} Entries`}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
