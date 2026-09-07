'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { uploadReport } from '@/lib/actions/report-actions'

/**
 * Ladda upp en rapport genom att välja filen, eller dra den hit.
 *
 * Filen läses i webbläsaren och skickas som text — ingen fillagring behövs, och
 * filnamnet följer med eftersom det bär datum och bolag. Flera filer går att ta
 * i en gång, så en hel mapp kan läsas in på en gång första gången.
 */
export function ReportUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setDone(null)

    startTransition(async () => {
      const list = Array.from(files)
      let created = 0
      let updated = 0
      const failed: string[] = []

      for (const file of list) {
        try {
          const text = await file.text()
          const res = await uploadReport(file.name, text)
          if (res.created) created++
          else updated++
        } catch (err) {
          failed.push(`${file.name}: ${err instanceof Error ? err.message : 'okänt fel'}`)
        }
      }

      const parts: string[] = []
      if (created) parts.push(`${created} ny${created === 1 ? '' : 'a'}`)
      if (updated) parts.push(`${updated} uppdaterad${updated === 1 ? '' : 'e'}`)
      setDone(parts.length ? parts.join(', ') : null)
      setError(failed.length ? failed.join(' · ') : null)
      router.refresh()
    })
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
        dragging ? 'border-[#D4A301] bg-[#F2BB01]/5' : 'border-[#B8B8B8]/70'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,text/markdown,text/plain"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <Upload className="mx-auto size-5 text-[#B8B8B8]" />
      <p className="mt-2 text-sm text-[#6B6B6B]">
        Dra rapportfilerna hit, eller{' '}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="text-[#656565] underline underline-offset-2 hover:text-[#1A1A1A]"
        >
          välj filer
        </button>
      </p>
      <p className="mt-1 text-xs text-[#9A9A9A]">
        Filnamnet måste vara ÅÅÅÅ-MM-DD--bolagsnamn.md. Samma rapport kan skickas om utan att bli
        två poster.
      </p>

      {isPending && <p className="mt-2 text-xs text-[#6B6B6B]">Läser in…</p>}
      {done && <p className="mt-2 text-sm text-[#1A1A1A]">Inläst: {done}</p>}
      {error && <p className="mt-2 text-sm text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
