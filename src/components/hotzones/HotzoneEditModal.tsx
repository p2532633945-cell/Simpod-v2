"use client"

/**
 * HotzoneEditModal - 热区编辑模态框
 * 
 * 支持编辑热区时间范围、标题、描述，以及删除热区
 */

import { useState, useCallback } from "react"
import { X, Trash2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hotzone } from "@/types/simpod"
import { formatTime } from "@/lib/time"

interface HotzoneEditModalProps {
  hotzone: Hotzone
  isOpen: boolean
  onClose: () => void
  onSave: (hotzone: Hotzone) => Promise<void>
  onDelete: (hotzoneId: string) => Promise<void>
  maxDuration: number
}

export function HotzoneEditModal({
  hotzone,
  isOpen,
  onClose,
  onSave,
  onDelete,
  maxDuration,
}: HotzoneEditModalProps) {
  const [editedHotzone, setEditedHotzone] = useState<Hotzone>(hotzone)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 当 hotzone 改变时更新编辑状态
  if (isOpen && editedHotzone.id !== hotzone.id) {
    setEditedHotzone(hotzone)
  }

  const handleStartTimeChange = useCallback((value: string) => {
    const newStartTime = parseFloat(value) || 0
    if (newStartTime < editedHotzone.end_time && newStartTime >= 0) {
      setEditedHotzone(prev => ({ ...prev, start_time: newStartTime }))
      setError(null)
    } else {
      setError("Start time must be less than end time")
    }
  }, [editedHotzone.end_time])

  const handleEndTimeChange = useCallback((value: string) => {
    const newEndTime = parseFloat(value) || 0
    if (newEndTime > editedHotzone.start_time && newEndTime <= maxDuration) {
      setEditedHotzone(prev => ({ ...prev, end_time: newEndTime }))
      setError(null)
    } else {
      setError("End time must be greater than start time and within duration")
    }
  }, [editedHotzone.start_time, maxDuration])

  const handleTitleChange = useCallback((value: string) => {
    setEditedHotzone(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title: value
      }
    }))
  }, [])

  const handleDescriptionChange = useCallback((value: string) => {
    setEditedHotzone(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        description: value
      }
    }))
  }, [])

  const handleSave = async () => {
    if (error) return

    setIsSaving(true)
    try {
      console.log('[HotzoneEditModal] Saving hotzone:', { id: editedHotzone.id, start_time: editedHotzone.start_time, end_time: editedHotzone.end_time })
      await onSave(editedHotzone)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save hotzone'
      console.error('[HotzoneEditModal] Error saving hotzone:', message)
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log('[HotzoneEditModal] Deleting hotzone:', editedHotzone.id)
      await onDelete(editedHotzone.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete hotzone'
      console.error('[HotzoneEditModal] Error deleting hotzone:', message)
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const title = editedHotzone.metadata?.title || `Hotzone ${formatTime(editedHotzone.start_time)}`
  const description = editedHotzone.metadata?.description || ""

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
            <h2 className="text-lg font-semibold text-foreground">Edit Hotzone</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Time Range Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Time Range</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Start Time (s)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editedHotzone.end_time}
                    step="0.1"
                    value={editedHotzone.start_time}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-simpod-primary"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(editedHotzone.start_time)}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    End Time (s)
                  </label>
                  <input
                    type="number"
                    min={editedHotzone.start_time}
                    max={maxDuration}
                    step="0.1"
                    value={editedHotzone.end_time}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-simpod-primary"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(editedHotzone.end_time)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Duration: {formatTime(editedHotzone.end_time - editedHotzone.start_time)}
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter hotzone title"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-simpod-primary"
              />
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter hotzone description (supports Markdown)"
                rows={4}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-simpod-primary resize-none"
              />
            </div>

            {/* Transcript Snippet */}
            {editedHotzone.transcript_snippet && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Transcript
                </label>
                <div className="p-3 bg-secondary/50 border border-border rounded-lg text-sm text-muted-foreground max-h-24 overflow-y-auto">
                  {editedHotzone.transcript_snippet}
                </div>
              </div>
            )}

            {/* Metadata Info */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>Status: <span className="capitalize">{editedHotzone.status}</span></div>
              <div>Source: <span className="capitalize">{editedHotzone.source}</span></div>
              <div>Created: {new Date(editedHotzone.created_at).toLocaleString()}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-secondary/30 space-y-2">
            {showDeleteConfirm ? (
              <>
                <p className="text-sm text-foreground mb-3">
                  Are you sure you want to delete this hotzone? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm font-medium text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Delete hotzone"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !!error}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2",
                    "transition-colors",
                    isSaving || error
                      ? "bg-simpod-primary/50 text-simpod-dark cursor-not-allowed"
                      : "bg-simpod-primary text-simpod-dark hover:bg-simpod-primary/90"
                  )}
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
