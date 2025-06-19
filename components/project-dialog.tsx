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
import type { Client } from "@/lib/types"

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess: () => void
}

const PROJECT_COLORS = [
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#059669",
  "#0d9488",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#dc2626",
]

export default function ProjectDialog({ open, onOpenChange, client, onSuccess }: ProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("projects").insert({
        name,
        description: description || null,
        hourly_rate: hourlyRate ? Number.parseFloat(hourlyRate) : null,
        color,
        client_id: client.id,
        user_id: user.id,
      })

      if (error) throw error

      setName("")
      setDescription("")
      setHourlyRate("")
      setColor(PROJECT_COLORS[0])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">Create New Project</DialogTitle>
          <DialogDescription className="text-forest-600">Add a new project to {client?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-forest-700">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className="border-forest-200 focus:border-forest-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project"
              className="border-forest-200 focus:border-forest-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-hourlyRate" className="text-forest-700">
              Hourly Rate ($) - Optional Override
            </Label>
            <Input
              id="project-hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder={`Default: $${client?.hourly_rate || 0}/hr`}
              className="border-forest-200 focus:border-forest-500"
            />
            <p className="text-xs text-forest-500">Leave empty to use client rate (${client?.hourly_rate || 0}/hr)</p>
          </div>

          <div className="space-y-2">
            <Label className="text-forest-700">Project Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((projectColor) => (
                <button
                  key={projectColor}
                  type="button"
                  onClick={() => setColor(projectColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === projectColor ? "border-forest-800 scale-110" : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: projectColor }}
                />
              ))}
            </div>
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
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
