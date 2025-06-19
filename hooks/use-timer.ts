"use client";

import { createClient } from "@/lib/supabase/client";
import type { TimeEntry } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerProps {
  activityId: string;
  onUpdate?: (entry: TimeEntry) => void;
}

export function useTimer({ activityId, onUpdate }: UseTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Auto-save every 10 seconds
  const SAVE_INTERVAL = 10000;

  const saveProgress = useCallback(async () => {
    if (!currentEntry || !isRunning) return;

    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          duration: seconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEntry.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [currentEntry, seconds, isRunning, supabase]);

  const startTimer = async () => {
    try {
      // Stop any existing running timers for this activity
      const { error: stopError } = await supabase
        .from("time_entries")
        .update({ is_running: false })
        .eq("activity_id", activityId)
        .eq("is_running", true);

      if (stopError) {
        console.error("Error stopping existing timers:", stopError);
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      // Create new time entry
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          activity_id: activityId,
          user_id: user.id,
          start_time: new Date().toISOString(),
          is_running: true,
          duration: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from insert");
      }

      setCurrentEntry(data);
      setIsRunning(true);
      setSeconds(0);

      // Start the timer
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Start auto-save
      saveIntervalRef.current = setInterval(saveProgress, SAVE_INTERVAL);

      onUpdate?.(data);
    } catch (error) {
      console.error("Error starting timer:", error);
      // Show user-friendly error
      alert("Failed to start timer. Please try again.");
    }
  };

  const stopTimer = async () => {
    if (!currentEntry) return;

    try {
      const endTime = new Date().toISOString();
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          end_time: endTime,
          duration: seconds,
          is_running: false,
          updated_at: endTime,
        })
        .eq("id", currentEntry.id)
        .select()
        .single();

      if (error) throw error;

      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);

      onUpdate?.(data);
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  // Check for existing running timer on mount
  useEffect(() => {
    const checkRunningTimer = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User authentication error:", userError);
          return;
        }

        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("activity_id", activityId)
          .eq("user_id", user.id)
          .eq("is_running", true)
          .maybeSingle();

        if (error) {
          console.error("Error checking running timer:", error);
          return;
        }

        if (data) {
          setCurrentEntry(data);
          setIsRunning(true);
          const elapsed = Math.floor(
            (Date.now() - new Date(data.start_time).getTime()) / 1000
          );
          setSeconds(elapsed);

          intervalRef.current = setInterval(() => {
            setSeconds((prev) => prev + 1);
          }, 1000);

          saveIntervalRef.current = setInterval(saveProgress, SAVE_INTERVAL);
        }
      } catch (error) {
        console.error("Error checking running timer:", error);
      }
    };

    checkRunningTimer();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [activityId, supabase]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue =
          "You have a running timer. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRunning]);

  return {
    isRunning,
    seconds,
    currentEntry,
    startTimer,
    stopTimer,
    saveProgress,
  };
}
