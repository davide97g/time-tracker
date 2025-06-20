"use client";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/lib/supabase/client";
import type { Activity } from "@/lib/types";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

interface ActivityDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity & {
    time_entries?: Array<{ id: string; duration?: number }>;
  };
  onSuccess: () => void;
}

export default function ActivityDeleteDialog({
  open,
  onOpenChange,
  activity,
  onSuccess,
}: ActivityDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const totalSessions = activity.time_entries?.length || 0;
  const totalTime =
    activity.time_entries?.reduce(
      (total, entry) => total + (entry.duration || 0),
      0
    ) || 0;
  const isConfirmed = confirmText.toLowerCase() === activity.name.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsLoading(true);

    try {
      // Delete the activity - time entries will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activity.id);

      if (error) throw error;

      onOpenChange(false);
      setConfirmText("");
      onSuccess();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-800 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Activity</span>
          </DialogTitle>
          <DialogDescription className="text-red-600">
            This action cannot be undone. This will permanently delete the
            activity and all associated time entries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Summary */}
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">
              What will be deleted:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>
                • Activity: <strong>{activity.name}</strong>
              </li>
              <li>
                • <strong>{totalSessions}</strong> time tracking sessions
              </li>
              <li>
                • <strong>{formatDuration(totalTime)}</strong> of recorded time
              </li>
              {activity.description && (
                <li>• Activity description and settings</li>
              )}
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-red-700">
              Type the activity name <strong>"{activity.name}"</strong> to
              confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={activity.name}
              className="border-red-200 focus:border-red-500"
            />
          </div>

          {totalSessions > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Data Loss Warning:</strong> This activity has{" "}
                {totalSessions} time entries totaling{" "}
                {formatDuration(totalTime)}. All this data will be permanently
                lost.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmText("");
            }}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || isLoading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? "Deleting..." : "Delete Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
