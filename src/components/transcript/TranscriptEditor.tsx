"use client"

/**
 * TranscriptEditor - 转录编辑组件（P5-7）
 *
 * 支持编辑转录文本、撤销/重做、添加注释
 */

import { useState, useCallback, useRef } from "react"
import { Edit2, Check, X, RotateCcw, RotateCw, MessageSquare, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hotzone } from "@/types/simpod"

interface TranscriptEditorProps {
  hotzone: Hotzone
  onSave: (hotzoneId: string, newText: string, note: string) => Promise<void>
  className?: string
}

const MAX_HISTORY = 50

export function TranscriptEditor({ hotzone, onSave, className }: TranscriptEditorProps) {
  const originalText = hotzone.transcript_snippet || ""
  const originalNote = (hotzone.metadata?.description as string) || ""

  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(originalText)
  const [note, setNote] = useState(originalNote)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [showNote, setShowNote] = useState(false)

  // 撤销/重做历史
  const historyRef = useRef<string[]>([originalText])
  const historyIndexRef = useRef<number>(0)

  const pushHistory = useCallback((newText: string) => {
    // 截断未来历史
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(newText)
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }
  }, [])

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      setText(historyRef.current[historyIndexRef.current])
    }
  }, [])

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      setText(historyRef.current[historyIndexRef.current])
    }
  }, [])

  const handleTextChange = useCallback((value: string) => {
    setText(value)
    pushHistory(value)
  }, [pushHistory])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log('[TranscriptEditor] Saving transcript for hotzone:', hotzone.id)
      await onSave(hotzone.id, text, note)
      setSavedMsg(true)
      setIsEditing(false)
      setTimeout(() => setSavedMsg(false), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      console.error('[TranscriptEditor] Save error:', message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = useCallback(() => {
    setText(originalText)
    setNote(originalNote)
    historyRef.current = [originalText]
    historyIndexRef.current = 0
    setIsEditing(false)
  }, [originalText, originalNote])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1
  const hasChanges = text !== originalText || note !== originalNote

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transcript</span>
        <div className="flex items-center gap-1">
          {isEditing && (
            <>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 transition-colors"
                title="Undo"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 transition-colors"
                title="Redo"
              >
                <RotateCw size={13} />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}
          <button
            onClick={() => setShowNote(prev => !prev)}
            className={cn(
              "p-1 rounded transition-colors",
              showNote ? "bg-simpod-mark/10 text-simpod-primary" : "hover:bg-secondary text-muted-foreground"
            )}
            title="Toggle note"
          >
            <MessageSquare size={13} />
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
              title="Edit transcript"
            >
              <Edit2 size={13} />
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
                title="Cancel"
              >
                <X size={13} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={cn(
                  "p-1 rounded transition-colors",
                  hasChanges
                    ? "text-simpod-primary hover:bg-simpod-mark/10"
                    : "text-muted-foreground opacity-40"
                )}
                title="Save"
              >
                {isSaving ? (
                  <Save size={13} className="animate-pulse" />
                ) : (
                  <Check size={13} />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Saved message */}
      {savedMsg && (
        <div className="text-xs text-green-500 flex items-center gap-1">
          <Check size={12} /> Saved
        </div>
      )}

      {/* Transcript text */}
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 bg-secondary/50 border border-simpod-mark/30 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-simpod-primary resize-none leading-relaxed"
          autoFocus
        />
      ) : (
        <div
          className={cn(
            "px-3 py-2 bg-secondary/30 rounded-lg text-sm leading-relaxed",
            text ? "text-foreground/90" : "text-muted-foreground italic"
          )}
        >
          {text || "No transcript available"}
        </div>
      )}

      {/* Note field */}
      {showNote && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Note</span>
          {isEditing ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note or tag..."
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-simpod-primary resize-none"
            />
          ) : (
            <div className={cn(
              "px-3 py-2 bg-secondary/20 rounded-lg text-xs",
              note ? "text-muted-foreground" : "text-muted-foreground/50 italic"
            )}>
              {note || "No note"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
