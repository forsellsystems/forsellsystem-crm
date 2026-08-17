import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Briefcase } from 'lucide-react'
import { getAllDeals } from '@/lib/queries/deals'
import { getCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { PIPELINE_STAGES, DEAL_HEAT_LEVELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'

/**
 * Alla affärer som lista. Pipeline visar samma affärer som en tavla; den här
 * sidan finns för att kunna se allt på en gång utan att scrolla i kolumner.
 */
export default async function AffarerPage() {
  const [deals, companies, resellers, users, machines] = await Promise.all([
    getAllDeals(),
    getCompaniesForSelect(),
    getResellers(),
    getActiveUsers(),
    getMachines(),
  ])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Affärer</h2>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Alla affärer, oavsett stadium
          </p>
        </div>
        <NewDealDialog
          companies={companies}
          resellers={resellers}
          users={users}
          machines={machines}
        />
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-3 size-8 text-[#B8B8B8]" />
            <p className="text-sm text-[#6B6B6B]">Inga affärer ännu.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affär</TableHead>
                  <TableHead>Kund</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Stadium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Värde</TableHead>
                  <TableHead>Offertdatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((d) => {
                  const stage = PIPELINE_STAGES.find((s) => s.key === d.stage)
                  const heat = DEAL_HEAT_LEVELS.find((h) => h.value === d.heat)
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/pipeline/${d.id}`}
                          className="font-medium text-[#656565] hover:underline"
                        >
                          {d.quote_number ? `#${d.quote_number}` : 'Affär'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link href={d.company_href} className="text-[#6B6B6B] hover:underline">
                          {d.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {d.project_id ? (
                          <Link
                            href={`/projekt/${d.project_id}`}
                            className="hover:underline"
                          >
                            {d.project_name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {d.reseller_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {stage?.label ?? d.stage}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {heat ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: heat.color }}
                            />
                            {heat.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {d.value != null ? formatCurrency(d.value, d.currency) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {d.quote_date ? formatDate(d.quote_date) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
