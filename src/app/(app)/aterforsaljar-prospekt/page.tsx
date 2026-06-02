import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Handshake } from 'lucide-react'
import { getProspects } from '@/lib/queries/prospects'
import { formatDate } from '@/lib/utils'
import { ProspectFilters } from '@/components/prospects/prospect-filters'
import { ListTabs } from '@/components/layout/list-tabs'
import { Suspense } from 'react'

const RESELLER_TABS = [
  { label: 'Agenter', href: '/aterforsaljare' },
  { label: 'Prospekt', href: '/aterforsaljar-prospekt' },
]

export default async function AterforsaljarProspektPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const prospects = await getProspects({
    search: params.search,
    status: 'active',
    prospect_type: 'reseller',
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Agenter</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Hantera och kvalificera potentiella agenter
          </p>
        </div>
        <Link href="/aterforsaljar-prospekt/ny">
          <Button className="bg-[#F2BB01] hover:bg-[#B07830] text-white">
            <Plus className="size-4" data-icon="inline-start" />
            Nytt agent-prospekt
          </Button>
        </Link>
      </div>

      <ListTabs items={RESELLER_TABS} />

      <Suspense>
        <ProspectFilters basePath="/aterforsaljar-prospekt" showFactoryType={false} />
      </Suspense>

      {prospects.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <Handshake className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Inga agent-prospekt hittades.</p>
              <p className="text-xs mt-1">
                Klicka på &ldquo;Nytt agent-prospekt&rdquo; för att skapa ditt
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
                  <TableHead>Land</TableHead>
                  <TableHead>Kontaktperson</TableHead>
                  <TableHead>Skapad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <Link
                        href={`/aterforsaljar-prospekt/${prospect.id}`}
                        className="font-medium text-[#656565] hover:underline"
                      >
                        {prospect.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B6B6B]">
                      {prospect.country}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B6B6B]">
                      {prospect.contact_person ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B6B6B]">
                      {formatDate(prospect.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
