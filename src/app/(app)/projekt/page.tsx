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
import { FolderKanban } from 'lucide-react'
import { getAllProjects } from '@/lib/queries/projects'
import { getCustomerCompaniesForSelect } from '@/lib/queries/companies'
import { getCustomerProspectsForSelect } from '@/lib/queries/prospects'
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { NewProjectDialog } from '@/components/projects/new-project-dialog'

export default async function ProjektPage() {
  const [projects, companies, prospects] = await Promise.all([
    getAllProjects(),
    getCustomerCompaniesForSelect(),
    getCustomerProspectsForSelect(),
  ])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Projekt</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Alla projekt hos kunder och prospekt
          </p>
        </div>
        <NewProjectDialog companies={companies} prospects={prospects} />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <FolderKanban className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Inga projekt ännu.</p>
              <p className="text-xs mt-1">
                Lägg till projekt på en kund eller ett prospekt.
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
                  <TableHead>Projekt</TableHead>
                  <TableHead>Bolag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const status = PROJECT_STATUSES.find((s) => s.key === p.status)
                  const projectLabel =
                    p.name?.trim() ||
                    PROJECT_TYPES.find((t) => t.key === p.project_type)?.label ||
                    'Projekt'
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/projekt/${p.id}`}
                          className="font-medium text-[#656565] hover:underline"
                        >
                          {projectLabel}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link
                          href={p.entity_href}
                          className="text-[#6B6B6B] hover:underline"
                        >
                          {p.entity_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {status ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {p.value_unknown
                          ? 'Okänd'
                          : p.value != null
                            ? formatCurrency(p.value, p.currency)
                            : '—'}
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
