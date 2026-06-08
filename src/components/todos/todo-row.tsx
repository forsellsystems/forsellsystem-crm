'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn, formatDate } from '@/lib/utils'
import { toggleTodo } from '@/lib/actions/todo-actions'
import type { TodoWithEntity } from '@/lib/queries/todos'

const sourceLabel: Record<string, string> = {
  comment: 'Kommentar',
  meeting: 'Möte',
  manual: 'Manuell',
}

export function TodoRow({ todo, todayISO }: { todo: TodoWithEntity; todayISO: string }) {
  const [isPending, startTransition] = useTransition()
  const overdue = !todo.done && !!todo.due_date && todo.due_date < todayISO

  function handleToggle() {
    startTransition(async () => {
      await toggleTodo(todo.id, !todo.done)
    })
  }

  return (
    <TableRow className={cn(isPending && 'opacity-50')}>
      <TableCell className="w-8">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={handleToggle}
          className="accent-[#656565] size-4 shrink-0"
        />
      </TableCell>
      <TableCell>
        <span className={cn('text-sm', todo.done ? 'line-through text-[#9A9A9A]' : 'text-[#1A1A1A]')}>
          {todo.content}
        </span>
      </TableCell>
      <TableCell className="text-sm">
        <span className="flex items-center gap-1.5 flex-wrap">
          {todo.entity_href ? (
            <Link href={todo.entity_href} className="text-[#656565] hover:underline">
              {todo.entity_name}
            </Link>
          ) : (
            <span className="text-[#9A9A9A]">Internt</span>
          )}
          {todo.source === 'meeting' && todo.source_href ? (
            <Link href={todo.source_href} className="text-xs text-[#6B6B6B] hover:underline">
              · Möte
            </Link>
          ) : (
            <span className="text-xs text-[#9A9A9A]">· {sourceLabel[todo.source] ?? ''}</span>
          )}
        </span>
      </TableCell>
      <TableCell className={cn('text-sm', overdue ? 'text-[#8B3D3D] font-medium' : 'text-[#6B6B6B]')}>
        {todo.due_date ? formatDate(todo.due_date) : '—'}
      </TableCell>
    </TableRow>
  )
}
