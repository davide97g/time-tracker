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
import type { Project } from "@/lib/types"

interface ActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onSuccess: () => void
}

export default function ActivityDialog({ open, onOpenChange, project, onSuccess }: ActivityDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const effectiveRate = project?.hourly_rate ?? project?.client?.hourly_rate ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("activities").insert({
        name,
        description: description || null,
        hourly_rate: hourlyRate ? Number.parseFloat(hourlyRate) : null,
        project_id: project.id,
        user_id: user.id,
      })

      if (error) throw error

      setName("")
      setDescription("")
      setHourlyRate("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating activity:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">Create New Activity</DialogTitle>
          <DialogDescription className="text-forest-600">Add a new activity to {project?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name" className="text-forest-700">
              Activity Name
            </Label>
            <Input
              id="activity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter activity name"
              className="border-forest-200 focus:border-forest-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="activity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this activity"
              className="border-forest-200 focus:border-forest-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-hourlyRate" className="text-forest-700">
              Hourly Rate ($) - Optional Override
            </Label>
            <Input
              id="activity-hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder={`Default: $${effectiveRate}/hr`}
              className="border-forest-200 focus:border-forest-500"
            />
            <p className="text-xs text-forest-500">Leave empty to use project/client rate (${effectiveRate}/hr)</p>
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
              disabled={isLoading || !name.trim()}
              className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
            >
              {isLoading ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
