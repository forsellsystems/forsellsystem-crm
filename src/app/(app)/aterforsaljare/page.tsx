import Link from 'next/link'
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
import { Handshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResellerDialog } from '@/components/settings/reseller-dialog'
import { RemoveResellerButton } from '@/components/settings/remove-reseller-button'

async function getResellersWithDetails() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, country, email, phone, created_at')
    .eq('is_reseller', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

export default async function AterforsaljarePage() {
  const resellers = await getResellersWithDetails()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1F1D]">
            Återförsäljare
          </h2>
          <p className="text-sm text-[#6B7672] mt-1">
            Partners som säljer era maskiner
          </p>
        </div>
        <ResellerDialog />
      </div>

      {resellers.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B7672]">
              <Handshake className="h-12 w-12 mb-4 text-[#B8BFBB]" />
              <p className="text-sm">Inga återförsäljare ännu.</p>
              <p className="text-xs mt-1">
                Lägg till era återförsäljare för att koppla dem till affärer.
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
                  <TableHead>Namn</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((reseller) => (
                  <TableRow key={reseller.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/aterforsaljare/${reseller.id}`}
                          className="font-medium text-[#50645F] hover:underline"
                        >
                          {reseller.name}
                        </Link>
                        <Badge
                          variant="outline"
                          className="text-[#C4883A] border-[#C4883A]/40 text-[10px]"
                        >
                          Återförsäljare
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {reseller.country}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {reseller.email ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[#6B7672]">
                      {reseller.phone ?? '—'}
                    </TableCell>
                    <TableCell>
                      <RemoveResellerButton companyId={reseller.id} />
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
