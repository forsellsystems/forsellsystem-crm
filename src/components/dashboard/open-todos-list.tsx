import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDayLabel } from '@/lib/utils'
import type { TodoWithEntity } from '@/lib/queries/todos'

export function OpenTodosList({ todos }: { todos: TodoWithEntity[] }) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
          Att göra
        </CardTitle>
        <Link href="/todo" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A]">
          Visa alla
        </Link>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-6">Inget att göra just nu.</p>
        ) : (
          <div className="divide-y divide-[#B8B8B8]/40">
            {todos.map((t) => {
              const overdue = t.due_date != null && t.due_date < today
              return (
                <Link
                  key={t.id}
                  href={t.entity_href ?? '/todo'}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{t.content}</p>
                    {t.entity_name && (
                      <p className="truncate text-xs text-[#6B6B6B]">{t.entity_name}</p>
                    )}
                  </div>
                  {t.due_date && (
                    <span
                      className={cn(
                        'shrink-0 text-xs',
                        overdue ? 'font-medium text-[#8B3D3D]' : 'text-[#6B6B6B]'
                      )}
                    >
                      {formatDayLabel(t.due_date)}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
