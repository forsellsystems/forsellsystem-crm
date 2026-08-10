'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Agenda-style bullet input: type a line, press Enter → it becomes a bullet.
// Value is a string[] (serialize with joinBullets for a TEXT column).
export const parseBullets = (s?: string | null): string[] =>
  (s ?? '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

export const joinBullets = (items: string[]): string => items.join('\n')

export function BulletListInput({
  value,
  onChange,
  placeholder = 'Skriv en punkt, tryck Enter',
  disabled,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...value, t])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#656565]" />
              <span className="flex-1 break-words">{item}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                disabled={disabled}
                className="mt-0.5 text-[#9A9A9A] hover:text-[#8B3D3D]"
                aria-label="Ta bort punkt"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={add}
          disabled={disabled || !draft.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
