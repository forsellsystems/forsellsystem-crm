'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { deleteNote } from '@/lib/actions/note-actions'

export function DeleteNoteButton({
  noteId,
  entityType,
  entityId,
}: {
  noteId: string
  entityType: string
  entityId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteNote(noteId, entityType, entityId)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8B3D3D] hover:text-[#8B3D3D]/80 disabled:opacity-30"
      title="Ta bort anteckning"
    >
      <X className="size-3.5" />
    </button>
  )
}
