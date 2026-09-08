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
  setReportType,
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
  const isReseller = report.report_type === 'reseller'

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
                const created = await createProspectFromReport(report.id)
                router.push(created.href)
              })
            }
            disabled={isPending}
          >
            {isReseller ? 'Skapa agent-prospekt' : 'Skapa prospekt'}
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
            {/* Bara spårets egna bolag. Ligger rapporten i fel flik flyttar man
                den i stället, med knappen nedanför. */}
            {(isReseller ? resellerProspects : customerProspects).length > 0 && (
              <optgroup label={isReseller ? 'Agent-prospekt' : 'Kund-prospekt'}>
                {(isReseller ? resellerProspects : customerProspects).map((o) => (
                  <option key={o.id} value={`prospect:${o.id}`}>{o.name}</option>
                ))}
              </optgroup>
            )}
            {(isReseller ? resellers : customers).length > 0 && (
              <optgroup label={isReseller ? 'Agenter' : 'Kunder'}>
                {(isReseller ? resellers : customers).map((o) => (
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

      <div className="flex flex-wrap items-center gap-2">
        {report.status !== 'ny' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run(() => reopenReport(report.id))}
            disabled={isPending}
          >
            Lägg tillbaka i inkorgen
          </Button>
        )}
        {!handled && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B6B6B]"
            onClick={() =>
              run(() => setReportType(report.id, isReseller ? 'customer' : 'reseller'))
            }
            disabled={isPending}
          >
            {isReseller ? 'Flytta till kundfliken' : 'Flytta till agentfliken'}
          </Button>
        )}
      </div>

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
                  router.push(isReseller ? '/rapporter?flik=agent' : '/rapporter')
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
