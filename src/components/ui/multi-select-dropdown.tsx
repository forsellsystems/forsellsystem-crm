'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// A dropdown that opens a checkbox list — pick several, one, or none. Stores the
// selected keys as a string[] (e.g. building_types).
export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = '—',
  disabled,
}: {
  options: readonly { key: string; label: string }[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selectedLabels = options.filter((o) => value.includes(o.key)).map((o) => o.label)
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
      >
        <span className={cn('truncate', selectedLabels.length ? 'text-[#1A1A1A]' : 'text-[#9A9A9A]')}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#6B6B6B]" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-background p-1 shadow-md">
          {options.map((o) => (
            <label
              key={o.key}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#F2F2F0]"
            >
              <input
                type="checkbox"
                checked={value.includes(o.key)}
                onChange={() => toggle(o.key)}
                className="accent-[#656565]"
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
