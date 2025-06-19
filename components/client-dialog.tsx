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

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const CLIENT_COLORS = [
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

export default function ClientDialog({ open, onOpenChange, onSuccess }: ClientDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [color, setColor] = useState(CLIENT_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("clients").insert({
        name,
        description: description || null,
        hourly_rate: Number.parseFloat(hourlyRate) || 0,
        color,
        user_id: user.id,
      })

      if (error) throw error

      setName("")
      setDescription("")
      setHourlyRate("")
      setColor(CLIENT_COLORS[0])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating client:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-forest-800">Create New Client</DialogTitle>
          <DialogDescription className="text-forest-600">
            Add a new client to organize your projects and set default hourly rates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-forest-700">
              Client Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client name"
              className="border-forest-200 focus:border-forest-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-forest-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your client"
              className="border-forest-200 focus:border-forest-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate" className="text-forest-700">
              Default Hourly Rate ($)
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              className="border-forest-200 focus:border-forest-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-forest-700">Client Color</Label>
            <div className="flex flex-wrap gap-2">
              {CLIENT_COLORS.map((clientColor) => (
                <button
                  key={clientColor}
                  type="button"
                  onClick={() => setColor(clientColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === clientColor ? "border-forest-800 scale-110" : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: clientColor }}
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
              {isLoading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
