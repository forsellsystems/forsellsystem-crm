'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, ListChecks, X } from 'lucide-react'
import { createNote } from '@/lib/actions/note-actions'

interface AddNoteFormProps {
  entityType: 'prospect' | 'company' | 'deal' | 'contact' | 'project'
  entityId: string
}

export function AddNoteForm({ entityType, entityId }: AddNoteFormProps) {
  const [content, setContent] = useState('')
  const [showTodo, setShowTodo] = useState(false)
  const [todoContent, setTodoContent] = useState('')
  const [todoDueDate, setTodoDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetTodo() {
    setShowTodo(false)
    setTodoContent('')
    setTodoDueDate('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const todo =
        showTodo && todoContent.trim()
          ? { content: todoContent.trim(), due_date: todoDueDate || undefined }
          : undefined
      await createNote(
        {
          entity_type: entityType,
          entity_id: entityId,
          content: content.trim(),
        },
        todo
      )
      setContent('')
      resetTodo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara anteckning')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Skriv en anteckning..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />

      {showTodo ? (
        <div className="rounded-lg border border-[#B8B8B8]/50 bg-[#F2F2F0]/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
              <ListChecks className="size-3.5" />
              To-do (nästa steg)
            </Label>
            <Button type="button" variant="ghost" size="icon-sm" onClick={resetTodo}>
              <X className="size-3.5" />
            </Button>
          </div>
          <Input
            value={todoContent}
            onChange={(e) => setTodoContent(e.target.value)}
            placeholder="T.ex. Skicka offert"
            className="h-8"
          />
          <div className="grid gap-1.5">
            <Label className="text-xs text-[#6B6B6B]">Slutdatum (valfritt)</Label>
            <Input
              type="date"
              value={todoDueDate}
              onChange={(e) => setTodoDueDate(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      ) : null}

      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}

      <div className="flex items-center justify-between">
        {!showTodo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTodo(true)}
            className="text-[#6B6B6B]"
          >
            <ListChecks className="size-3.5" data-icon="inline-start" />
            Lägg till to-do
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          <Send className="size-3.5" data-icon="inline-start" />
          {isSubmitting ? 'Sparar...' : 'Lägg till'}
        </Button>
      </div>
    </form>
  )
}
