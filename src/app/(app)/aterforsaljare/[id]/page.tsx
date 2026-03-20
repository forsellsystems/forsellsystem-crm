import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, Globe, Building2, Briefcase } from 'lucide-react'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'
import { createClient } from '@/lib/supabase/server'
import { getNotes } from '@/lib/queries/notes'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'

async function getReseller(id: string) {
  const supabase = await createClient()

  const [companyRes, dealsRes, customersRes] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).eq('is_reseller', true).single(),
    supabase.from('deals').select('*, companies!deals_company_id_fkey(name)').eq('reseller_id', id).order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name, country').eq('reseller_id', id).order('name'),
  ])

  if (companyRes.error) return null

  return {
    ...companyRes.data,
    deals: (dealsRes.data ?? []).map((d) => ({
      ...d,
      company_name: (d.companies as { name: string } | null)?.name ?? 'Okänt',
    })),
    customers: customersRes.data ?? [],
  }
}

export default async function ResellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [reseller, notes] = await Promise.all([
    getReseller(id),
    getNotes('company', id),
  ])

  if (!reseller) notFound()

  const getStageLabel = (key: string) =>
    PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/aterforsaljare">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl text-[#1A1A1A]">
                {reseller.name}
              </h2>
              <Badge
                variant="outline"
                className="text-[#D4A301] border-[#D4A301]/40"
              >
                Återförsäljare
              </Badge>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {reseller.country} &middot; Skapad {formatDate(reseller.created_at)}
            </p>
          </div>
        </div>
        <DeleteCompanyButton
          companyId={reseller.id}
          companyName={reseller.name}
          redirectTo="/aterforsaljare"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kontaktuppgifter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {reseller.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-[#6B6B6B]" />
                  <a href={`mailto:${reseller.email}`} className="text-[#656565] hover:underline">
                    {reseller.email}
                  </a>
                </div>
              )}
              {reseller.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-[#6B6B6B]" />
                  <a href={`tel:${reseller.phone}`} className="text-[#656565] hover:underline">
                    {reseller.phone}
                  </a>
                </div>
              )}
              {reseller.website && (
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-[#6B6B6B]" />
                  <a href={reseller.website} target="_blank" rel="noopener noreferrer" className="text-[#656565] hover:underline">
                    {reseller.website}
                  </a>
                </div>
              )}
              {!reseller.email && !reseller.phone && !reseller.website && (
                <p className="text-[#6B6B6B]">Inga kontaktuppgifter registrerade.</p>
              )}
            </CardContent>
          </Card>

          {/* Customers through this reseller */}
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kunder via denna återförsäljare</CardTitle>
            </CardHeader>
            <CardContent>
              {reseller.customers.length === 0 ? (
                <p className="text-sm text-[#6B6B6B] text-center py-4">
                  Inga kunder kopplade ännu.
                </p>
              ) : (
                <div className="divide-y divide-[#B8B8B8]/40">
                  {reseller.customers.map((customer: { id: string; name: string; country: string }) => (
                    <Link
                      key={customer.id}
                      href={`/foretag/${customer.id}`}
                      className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0 text-sm text-[#656565] hover:underline"
                    >
                      <Building2 className="size-3.5 text-[#6B6B6B]" />
                      {customer.name}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deals through this reseller */}
          {reseller.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärer via denna återförsäljare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#B8B8B8]/40">
                  {reseller.deals.map((deal: { id: string; quote_number: string | null; stage: string; value: number | null; created_at: string; company_name: string }) => (
                    <Link
                      key={deal.id}
                      href={`/pipeline/${deal.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="size-4 text-[#6B6B6B]" />
                        <div>
                          <p className="text-sm font-medium">{deal.company_name}</p>
                          <p className="text-xs text-[#6B6B6B]">
                            {deal.quote_number ? `#${deal.quote_number} · ` : ''}
                            {formatDate(deal.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {deal.value && (
                          <span className="text-sm font-medium">
                            {formatCurrency(deal.value)}
                          </span>
                        )}
                        <Badge variant="outline">
                          {getStageLabel(deal.stage)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddNoteForm entityType="company" entityId={reseller.id} />
              <NotesTimeline notes={notes} entityType="company" entityId={reseller.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
