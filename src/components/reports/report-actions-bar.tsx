'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  createProspectFromReport,
  linkReportToExisting,
  dismissReport,
  reopenReport,
  deleteReport,
} from '@/lib/actions/report-actions'
import type { ProspectReport } from '@/lib/types/database'

const selectClass =
  'flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50'

type Option = { id: string; name: string }

/**
 * Triageringen. Rapporten blir ett prospekt, kopplas till ett bolag som redan
 * finns, eller avfärdas — men bara när du klickar. Ingen av vägarna sker
 * automatiskt när rapporten kommer in.
 */
export function ReportActionsBar({
  report,
  customers,
  resellers,
  customerProspects,
  resellerProspects,
}: {
  report: ProspectReport
  customers: Option[]
  resellers: Option[]
  customerProspects: Option[]
  resellerProspects: Option[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handled = report.status === 'hanterad'

  function run(fn: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel')
      }
    })
  }

  function link() {
    if (!target) return
    const [kind, id] = target.split(':') as ['prospect' | 'company', string]
    run(async () => {
      await linkReportToExisting(report.id, { kind, id })
      setTarget('')
    })
  }

  return (
    <div className="space-y-3">
      {!handled && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              run(async () => {
                const id = await createProspectFromReport(report.id)
                router.push(`/prospekt/${id}`)
              })
            }
            disabled={isPending}
          >
            Skapa prospekt
          </Button>
          <Button
            variant="ghost"
            onClick={() => run(() => dismissReport(report.id))}
            disabled={isPending}
          >
            Avfärda
          </Button>
        </div>
      )}

      {!handled && (
        <div className="flex items-center gap-2">
          <select
            className={selectClass}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Koppla till befintligt bolag"
          >
            <option value="">Eller koppla till ett bolag som redan finns…</option>
            {customerProspects.length > 0 && (
              <optgroup label="Kund-prospekt">
                {customerProspects.map((o) => (
                  <option key={o.id} value={`prospect:${o.id}`}>{o.name}</option>
                ))}
              </optgroup>
            )}
            {customers.length > 0 && (
              <optgroup label="Kunder">
                {customers.map((o) => (
                  <option key={o.id} value={`company:${o.id}`}>{o.name}</option>
                ))}
              </optgroup>
            )}
            {resellerProspects.length > 0 && (
              <optgroup label="Agent-prospekt">
                {resellerProspects.map((o) => (
                  <option key={o.id} value={`prospect:${o.id}`}>{o.name}</option>
                ))}
              </optgroup>
            )}
            {resellers.length > 0 && (
              <optgroup label="Agenter">
                {resellers.map((o) => (
                  <option key={o.id} value={`company:${o.id}`}>{o.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <Button variant="ghost" size="sm" onClick={link} disabled={isPending || !target}>
            Koppla
          </Button>
        </div>
      )}

      {report.status !== 'ny' && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run(() => reopenReport(report.id))}
            disabled={isPending}
          >
            Lägg tillbaka i inkorgen
          </Button>
        </div>
      )}

      <div className="border-t border-[#B8B8B8]/40 pt-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B6B6B]">
              Radera rapporten? Anteckningen på bolaget ligger kvar.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                run(async () => {
                  await deleteReport(report.id)
                  router.push('/rapporter')
                })
              }
              disabled={isPending}
            >
              Ja, radera
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Avbryt
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B6B6B]"
            onClick={() => setConfirmDelete(true)}
            disabled={isPending}
          >
            Radera rapport
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}
    </div>
  )
}
