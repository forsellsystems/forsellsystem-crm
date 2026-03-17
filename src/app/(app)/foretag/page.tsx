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
import { Plus, Building2 } from 'lucide-react'
import { getCompanies } from '@/lib/queries/companies'
import { CompanySearch } from '@/components/companies/company-search'
import { Suspense } from 'react'

export default async function ForetagPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const companies = await getCompanies({ search: params.search })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1F1D]">Kunder</h2>
          <p className="text-sm text-[#6B7672] mt-1">
            Alla kunder och kundrelationer
          </p>
        </div>
        <Link href="/foretag/ny">
          <Button className="bg-[#C4883A] hover:bg-[#B07830] text-white">
            <Plus className="size-4" data-icon="inline-start" />
            Ny kund
          </Button>
        </Link>
      </div>

      <Suspense>
        <CompanySearch />
      </Suspense>

      {companies.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B7672]">
              <Building2 className="h-12 w-12 mb-4 text-[#B8BFBB]" />
              <p className="text-sm">Inga kunder hittades.</p>
              <p className="text-xs mt-1">
                Kunder skapas automatiskt vid konvertering av prospekt.
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
                  <TableHead>Kund</TableHead>
                  <TableHead>Kundnummer</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Ansvarig</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/foretag/${company.id}`}
                        className="font-medium text-[#50645F] hover:underline"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {company.customer_number ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {company.country}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {company.responsible_name ?? '—'}
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
