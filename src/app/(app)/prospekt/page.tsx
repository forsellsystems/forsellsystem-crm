import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Users } from 'lucide-react'
import { getProspects } from '@/lib/queries/prospects'
import { FACTORY_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { ProspectFilters } from '@/components/prospects/prospect-filters'
import { Suspense } from 'react'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Aktiv', variant: 'default' },
  converted: { label: 'Konverterad', variant: 'secondary' },
  archived: { label: 'Arkiverad', variant: 'outline' },
}

export default async function ProspektPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; factory_type?: string }>
}) {
  const params = await searchParams
  const prospects = await getProspects({
    search: params.search,
    status: params.status,
    factory_type: params.factory_type,
  })

  const getFactoryLabel = (key: string | null) =>
    FACTORY_TYPES.find((ft) => ft.key === key)?.label ?? '—'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Prospekt</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Hantera och kvalificera potentiella kunder
          </p>
        </div>
        <Link href="/prospekt/ny">
          <Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white">
            <Plus className="size-4" data-icon="inline-start" />
            Nytt prospekt
          </Button>
        </Link>
      </div>

      <Suspense>
        <ProspectFilters />
      </Suspense>

      {prospects.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <Users className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Inga prospekt hittades.</p>
              <p className="text-xs mt-1">
                Klicka på &ldquo;Nytt prospekt&rdquo; för att skapa ditt
                första.
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
                  <TableHead>Företag</TableHead>
                  <TableHead>Fabrikstyp</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Kontaktperson</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Skapad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => {
                  const status = statusLabels[prospect.status]
                  return (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <Link
                          href={`/prospekt/${prospect.id}`}
                          className="font-medium text-[#656565] hover:underline"
                        >
                          {prospect.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {getFactoryLabel(prospect.factory_type)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {prospect.country}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {prospect.contact_person ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant ?? 'outline'}>
                          {status?.label ?? prospect.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B6B6B]">
                        {formatDate(prospect.created_at)}
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
