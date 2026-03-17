import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  User,
  Briefcase,
  Star,
} from 'lucide-react'
import { getCompany } from '@/lib/queries/companies'
import { getNotes } from '@/lib/queries/notes'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { ContactDialog, EditContactButton } from '@/components/companies/contact-dialog'
import { CompanyEditDialog } from '@/components/companies/company-edit-dialog'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'

export default async function ForetagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [company, notes] = await Promise.all([
    getCompany(id),
    getNotes('company', id),
  ])

  if (!company) notFound()

  const getStageLabel = (key: string) =>
    PIPELINE_STAGES.find((s) => s.key === key)?.label ?? key

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/foretag">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-display text-3xl text-[#1A1F1D]">
              {company.name}
            </h2>
            <p className="text-sm text-[#6B7672] mt-1">
              {company.customer_number && `#${company.customer_number} · `}
              {company.country}
              {company.responsible_name &&
                ` · Ansvarig: ${company.responsible_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CompanyEditDialog company={company} />
          <DeleteCompanyButton companyId={company.id} companyName={company.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Company info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Företagsuppgifter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {company.org_number && (
                <div className="flex justify-between">
                  <span className="text-[#6B7672]">Org.nummer</span>
                  <span>{company.org_number}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-[#6B7672]" />
                  <a
                    href={`mailto:${company.email}`}
                    className="text-[#50645F] hover:underline"
                  >
                    {company.email}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-[#6B7672]" />
                  <a
                    href={`tel:${company.phone}`}
                    className="text-[#50645F] hover:underline"
                  >
                    {company.phone}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-[#6B7672]" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#50645F] hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {company.reseller_name && (
                <div className="flex justify-between">
                  <span className="text-[#6B7672]">Återförsäljare</span>
                  <span className="text-[#C4883A] font-medium">{company.reseller_name}</span>
                </div>
              )}
              {company.fortnox_customer_id ? (
                <div className="flex justify-between">
                  <span className="text-[#6B7672]">Fortnox</span>
                  <span>{company.fortnox_customer_id}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-[#6B7672]">Fortnox</span>
                  <span className="text-[#B8BFBB]">Ej ansluten</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Kontakter</CardTitle>
              <ContactDialog companyId={company.id} />
            </CardHeader>
            <CardContent>
              {!company.contacts || company.contacts.length === 0 ? (
                <p className="text-sm text-[#6B7672] text-center py-4">
                  Inga kontakter registrerade.
                </p>
              ) : (
                <div className="divide-y divide-[#B8BFBB]/40">
                  {company.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-[#6B7672]" />
                          <span className="font-medium text-sm">
                            {contact.name}
                          </span>
                          {contact.is_primary && (
                            <Star className="size-3 text-[#C4883A] fill-[#C4883A]" />
                          )}
                        </div>
                        {contact.title && (
                          <p className="text-xs text-[#6B7672] ml-5">
                            {contact.title}
                          </p>
                        )}
                        <div className="flex gap-3 ml-5 text-xs text-[#6B7672]">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                      <EditContactButton
                        companyId={company.id}
                        contact={contact}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deals */}
          {company.deals && company.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Affärer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#B8BFBB]/40">
                  {company.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/pipeline/${deal.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F0F2F1] -mx-4 px-4 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="size-4 text-[#6B7672]" />
                        <div>
                          <p className="text-sm font-medium">
                            {deal.quote_number || 'Affär'}
                          </p>
                          <p className="text-xs text-[#6B7672]">
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
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddNoteForm entityType="company" entityId={company.id} />
              <NotesTimeline notes={notes} entityType="company" entityId={company.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
