"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project } from "@/lib/types"

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  onSuccess: () => void
}

export default function TimeEntryDialog({ open, onOpenChange, projects, onSuccess }: TimeEntryDialogProps) {
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const allActivities = projects.flatMap((project) =>
    (project.activities || []).map((activity) => ({
      ...activity,
      projectName: project.name,
    })),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActivityId || !startTime || !endTime) return

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const start = new Date(startTime).toISOString()
      const end = new Date(endTime).toISOString()
      const duration = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)

      const { error } = await supabase.from("time_entries").insert({
        activity_id: selectedActivityId,
        user_id: user.id,
        start_time: start,
        end_time: end,
        duration,
        description: description || null,
        is_running: false,
      })

      if (error) throw error

      setSelectedActivityId("")
      setStartTime("")
      setEndTime("")
      setDescription("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating time entry:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">Manual Time Entry</DialogTitle>
          <DialogDescription className="text-forest-600">
            Add a time entry for work you've already completed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-forest-700">Activity</Label>
            <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
              <SelectTrigger className="border-forest-200 focus:border-forest-500">
                <SelectValue placeholder="Select an activity" />
              </SelectTrigger>
              <SelectContent>
                {allActivities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.projectName} - {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-forest-700">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time" className="text-forest-700">
                End Time
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-forest-200 focus:border-forest-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="entry-description"
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
              disabled={isLoading || !selectedActivityId || !startTime || !endTime}
              className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
            >
              {isLoading ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
