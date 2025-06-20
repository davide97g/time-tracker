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
import type React from "react";
import { useState } from "react";

interface ManualTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  onSuccess: () => void;
}

export default function ManualTimeEntryDialog({
  open,
  onOpenChange,
  activityId,
  onSuccess,
}: ManualTimeEntryDialogProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const start = new Date(startTime).toISOString();
      const end = new Date(endTime).toISOString();
      const duration = Math.floor(
        (new Date(end).getTime() - new Date(start).getTime()) / 1000
      );

      const { error } = await supabase.from("time_entries").insert({
        activity_id: activityId,
        user_id: user.id,
        start_time: start,
        end_time: end,
        duration,
        description: description || null,
        is_running: false,
      });

      if (error) throw error;

      setStartTime("");
      setEndTime("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating time entry:", error);
      alert("Failed to create time entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">
            Add Manual Time Entry
          </DialogTitle>
          <DialogDescription className="text-forest-600">
            Add a time entry for work you've already completed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual-start-time" className="text-forest-700">
                Start Time
              </Label>
              <Input
                id="manual-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-end-time" className="text-forest-700">
                End Time
              </Label>
              <Input
                id="manual-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="manual-description"
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
              {isLoading ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
