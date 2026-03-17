'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { createNote } from '@/lib/actions/note-actions'

interface AddNoteFormProps {
  entityType: 'prospect' | 'company' | 'deal' | 'contact'
  entityId: string
}

export function AddNoteForm({ entityType, entityId }: AddNoteFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createNote({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
      })
      setContent('')
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
      {error && <p className="text-xs text-[#8B3D3D]">{error}</p>}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
        >
          <Send className="size-3.5" data-icon="inline-start" />
          {isSubmitting ? 'Sparar...' : 'Lägg till'}
        </Button>
      </div>
    </form>
  )
}
