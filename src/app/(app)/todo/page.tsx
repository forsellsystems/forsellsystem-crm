import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ListChecks } from 'lucide-react'
import { getAllTodos } from '@/lib/queries/todos'
import {
  getCustomerCompaniesForSelect,
  getResellers,
} from '@/lib/queries/companies'
import {
  getCustomerProspectsForSelect,
  getResellerProspectsForSelect,
} from '@/lib/queries/prospects'
import { NewTodoDialog } from '@/components/todos/new-todo-dialog'
import { TodoRow } from '@/components/todos/todo-row'

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ klara?: string }>
}) {
  const params = await searchParams
  const showDone = params.klara === '1'

  const [todos, customers, resellers, customerProspects, resellerProspects] =
    await Promise.all([
      getAllTodos({ showDone }),
      getCustomerCompaniesForSelect(),
      getResellers(),
      getCustomerProspectsForSelect(),
      getResellerProspectsForSelect(),
    ])

  const todayISO = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">To-do</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Alla to-dos från kommentarer, möten och manuella
          </p>
        </div>
        <NewTodoDialog
          customers={customers}
          resellers={resellers}
          customerProspects={customerProspects}
          resellerProspects={resellerProspects}
        />
      </div>

      <div className="flex items-center gap-4 border-b border-[#B8B8B8]/40">
        <Link
          href="/todo"
          className={
            'font-condensed text-[11px] tracking-[0.12em] uppercase py-3 -mb-px border-b-2 transition-colors ' +
            (!showDone
              ? 'text-[#1A1A1A] border-[#F2BB01]'
              : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]')
          }
        >
          Öppna
        </Link>
        <Link
          href="/todo?klara=1"
          className={
            'font-condensed text-[11px] tracking-[0.12em] uppercase py-3 -mb-px border-b-2 transition-colors ' +
            (showDone
              ? 'text-[#1A1A1A] border-[#F2BB01]'
              : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]')
          }
        >
          Visa alla
        </Link>
      </div>

      {todos.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <ListChecks className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">
                {showDone ? 'Inga to-dos ännu.' : 'Inga öppna to-dos.'}
              </p>
              <p className="text-xs mt-1">
                Lägg till en to-do på en kommentar, ett möte, eller direkt här.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>To-do</TableHead>
                  <TableHead>Koppling</TableHead>
                  <TableHead>Slutdatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todos.map((t) => (
                  <TodoRow key={t.id} todo={t} todayISO={todayISO} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
