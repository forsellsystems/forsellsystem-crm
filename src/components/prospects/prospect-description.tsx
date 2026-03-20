'use client'

import { useState, useRef, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProspectFields } from '@/lib/actions/prospect-actions'

export function ProspectDescription({
  prospectId,
  description,
  editable = true,
}: {
  prospectId: string
  description: string | null
  editable?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleEdit() {
    setValue(description ?? '')
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleCancel() {
    setValue(description ?? '')
    setEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateProspectFields(prospectId, { description: value })
      setEditing(false)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Beskrivning</CardTitle>
          {editable && !editing && (
            <Button variant="ghost" size="icon-sm" onClick={handleEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              placeholder="Skriv en beskrivning..."
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon-sm" onClick={handleCancel} disabled={isPending}>
                <X className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleSave} disabled={isPending}>
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        ) : description ? (
          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-sm text-[#6B6B6B]">Ingen beskrivning tillagd.</p>
        )}
      </CardContent>
    </Card>
  )
}
