import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import type { NoteWithAuthor } from '@/lib/queries/notes'
import { DeleteNoteButton } from '@/components/notes/delete-note-button'

interface NotesTimelineProps {
  notes: NoteWithAuthor[]
  entityType: string
  entityId: string
}

export function NotesTimeline({ notes, entityType, entityId }: NotesTimelineProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-[#6B6B6B] py-6 text-center">
        Inga anteckningar ännu.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="group relative pl-4 border-l-2 border-[#B8B8B8]/60"
        >
          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#656565]" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <span>{formatDateTime(note.created_at)}</span>
              {note.author_name && (
                <>
                  <span>&middot;</span>
                  <span>{note.author_name}</span>
                </>
              )}
              {note.source_entity_type && (
                <>
                  <span>&middot;</span>
                  <span className="italic">
                    Kopierad från {note.source_entity_type}
                  </span>
                </>
              )}
              {/* Anteckningen ligger på ett projekt och visas bara här. Den
                  raderas där den hör hemma, annars skulle den försvinna från
                  projektet utan att någon som tittar där förstår varför. */}
              {note.project_id ? (
                <>
                  <span>&middot;</span>
                  <Link
                    href={`/projekt/${note.project_id}`}
                    className="text-[#656565] hover:underline"
                  >
                    Projekt: {note.project_name}
                  </Link>
                </>
              ) : (
                <DeleteNoteButton
                  noteId={note.id}
                  entityType={entityType}
                  entityId={entityId}
                />
              )}
            </div>
            <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
