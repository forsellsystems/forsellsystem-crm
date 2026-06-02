import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  History,
  MessageSquare,
  MoveRight,
  Building2,
  UserPlus,
  Briefcase,
  FolderKanban,
} from 'lucide-react'
import { getActivityLog, type ActivityLogEntry } from '@/lib/queries/activity'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'

const stageLabel = (key?: string) =>
  PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key ?? ''

const actionIcon: Record<string, typeof History> = {
  note_added: MessageSquare,
  deal_stage_changed: MoveRight,
  company_created: Building2,
  prospect_created: UserPlus,
  deal_created: Briefcase,
  project_created: FolderKanban,
}

function EntryText({ entry }: { entry: ActivityLogEntry }) {
  const m = entry.metadata
  const label = m.href ? (
    <Link href={m.href} className="font-medium text-[#656565] hover:underline">
      {m.label}
    </Link>
  ) : (
    <span className="font-medium">{m.label}</span>
  )

  switch (entry.action) {
    case 'note_added':
      return <>La till kommentar på {label}</>
    case 'deal_stage_changed':
      return (
        <>
          Flyttade affär {label}: {stageLabel(m.from)} &rarr; {stageLabel(m.to)}
        </>
      )
    case 'company_created':
      return <>La till kund {label}</>
    case 'prospect_created':
      return <>La till prospekt {label}</>
    case 'deal_created':
      return <>Skapade affär {label}</>
    case 'project_created':
      return <>Skapade projekt{m.label ? <> hos {label}</> : ''}</>
    default:
      return <>{entry.action}</>
  }
}

export default async function LoggPage() {
  const entries = await getActivityLog()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Logg</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Senaste försäljningsaktiviteterna</p>
      </div>

      <Card>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <History className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Ingen aktivitet ännu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => {
                const Icon = actionIcon[entry.action] ?? History
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F2F2F0]">
                      <Icon className="size-3.5 text-[#656565]" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm text-[#1A1A1A]">
                        <EntryText entry={entry} />
                      </p>
                      {entry.action === 'note_added' && entry.metadata.snippet && (
                        <p className="text-xs text-[#6B6B6B] italic truncate">
                          &ldquo;{entry.metadata.snippet}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <span>{entry.user_name ?? 'System'}</span>
                        <span>&middot;</span>
                        <span>{formatRelativeTime(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
