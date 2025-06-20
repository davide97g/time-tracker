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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { TimeEntry } from "@/lib/types";
import type React from "react";
import { useEffect, useState } from "react";

interface TimeEntryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimeEntry | null;
  onSuccess: () => void;
}

export default function TimeEntryEditDialog({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: TimeEntryEditDialogProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (entry) {
      // Convert to local datetime format
      const start = new Date(entry.start_time);
      const end = entry.end_time ? new Date(entry.end_time) : new Date();

      setStartTime(start.toISOString().slice(0, 16));
      setEndTime(end.toISOString().slice(0, 16));
      setDescription(entry.description || "");
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !startTime || !endTime) return;

    setIsLoading(true);

    try {
      const start = new Date(startTime).toISOString();
      const end = new Date(endTime).toISOString();
      const duration = Math.floor(
        (new Date(end).getTime() - new Date(start).getTime()) / 1000
      );

      const { error } = await supabase
        .from("time_entries")
        .update({
          start_time: start,
          end_time: end,
          duration,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) throw error;

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating time entry:", error);
      alert("Failed to update time entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">Edit Time Entry</DialogTitle>
          <DialogDescription className="text-forest-600">
            Update the details of this time entry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time" className="text-forest-700">
                Start Time
              </Label>
              <Input
                id="edit-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-time" className="text-forest-700">
                End Time
              </Label>
              <Input
                id="edit-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="border-forest-200 focus:border-forest-500"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-forest-300 text-forest-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !startTime || !endTime}
              className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
            >
              {isLoading ? "Updating..." : "Update Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
