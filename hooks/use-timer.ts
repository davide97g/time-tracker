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
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const supabase = createClient();

  // Auto-save every 5 seconds
  const SAVE_INTERVAL = 5000;

  const saveProgress = useCallback(async () => {
    if (!currentEntry || !isRunning || !startTimeRef.current) return;

    try {
      // Calculate current duration based on actual elapsed time
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor(
        (currentTime - startTimeRef.current) / 1000
      );

      const { error } = await supabase
        .from("time_entries")
        .update({
          duration: elapsedSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEntry.id);

      if (error) {
        console.error("Error saving progress:", error);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [currentEntry, isRunning, supabase]);

  const startTimer = async () => {
    try {
      // Stop any existing running timers for this activity
      const { error: stopError } = await supabase
        .from("time_entries")
        .update({
          is_running: false,
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
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

      const startTime = new Date();
      startTimeRef.current = startTime.getTime();

      // Create new time entry
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          activity_id: activityId,
          user_id: user.id,
          start_time: startTime.toISOString(),
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

      // Start the timer - update every second
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor(
          (currentTime - startTimeRef.current) / 1000
        );
        setSeconds(elapsedSeconds);
      }, 1000);

      // Start auto-save interval
      saveIntervalRef.current = setInterval(saveProgress, SAVE_INTERVAL);

      onUpdate?.(data);
    } catch (error) {
      console.error("Error starting timer:", error);
      alert("Failed to start timer. Please try again.");
    }
  };

  const stopTimer = async () => {
    if (!currentEntry || !startTimeRef.current) return;

    try {
      const endTime = new Date();
      const finalDuration = Math.floor(
        (endTime.getTime() - startTimeRef.current) / 1000
      );

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          end_time: endTime.toISOString(),
          duration: finalDuration,
          is_running: false,
          updated_at: endTime.toISOString(),
        })
        .eq("id", currentEntry.id)
        .select()
        .single();

      if (error) throw error;

      setIsRunning(false);
      setSeconds(0);
      setCurrentEntry(null);
      startTimeRef.current = 0;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = undefined;
      }

      onUpdate?.(data);
    } catch (error) {
      console.error("Error stopping timer:", error);
      alert("Failed to stop timer. Please try again.");
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

          const startTime = new Date(data.start_time).getTime();
          startTimeRef.current = startTime;
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          setSeconds(elapsedSeconds);

          // Start the timer from current elapsed time
          intervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setSeconds(elapsed);
          }, 1000);

          // Start auto-save
          saveIntervalRef.current = setInterval(saveProgress, SAVE_INTERVAL);
        }
      } catch (error) {
        console.error("Error checking running timer:", error);
      }
    };

    checkRunningTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [activityId, supabase, saveProgress]);

  // Handle page unload - save final state
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isRunning && currentEntry && startTimeRef.current) {
        e.preventDefault();
        e.returnValue =
          "You have a running timer. Are you sure you want to leave?";

        // Try to save final state
        const finalDuration = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        await supabase
          .from("time_entries")
          .update({
            duration: finalDuration,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEntry.id);

        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRunning, currentEntry, supabase]);

  return {
    isRunning,
    seconds,
    currentEntry,
    startTimer,
    stopTimer,
    saveProgress,
  };
}
