import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  Briefcase,
  Star,
} from 'lucide-react'
import { getCompany, getResellers } from '@/lib/queries/companies'
import { getNotes } from '@/lib/queries/notes'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { NotesTimeline } from '@/components/notes/notes-timeline'
import { AddNoteForm } from '@/components/notes/add-note-form'
import { ContactDialog, EditContactButton } from '@/components/companies/contact-dialog'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'
import { CompanyContactCard } from '@/components/companies/company-contact-card'
import { CompanyDescriptionCard } from '@/components/companies/company-description-card'
import { CompanyDetailsCard } from '@/components/companies/company-details-card'
import { MoveToProspectButton } from '@/components/companies/move-to-prospect-button'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'

export default async function ForetagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [company, notes, resellers, users, machines] = await Promise.all([
    getCompany(id),
    getNotes('company', id),
    getResellers(),
    getActiveUsers(),
    getMachines(),
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
            <h2 className="font-display text-3xl text-[#1A1A1A]">
              {company.name}
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {company.customer_number && `#${company.customer_number} · `}
              {company.country}
              {company.responsible_name &&
                ` · Ansvarig: ${company.responsible_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MoveToProspectButton companyId={company.id} />
          <NewDealDialog
            companies={[{ id: company.id, name: company.name }]}
            resellers={resellers}
            users={users}
            machines={machines}
          />
          <DeleteCompanyButton companyId={company.id} companyName={company.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <CompanyContactCard company={company} />

          <CompanyDescriptionCard
            companyId={company.id}
            description={company.description}
          />

          <CompanyDetailsCard company={company} />

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Kontakter</CardTitle>
              <ContactDialog companyId={company.id} />
            </CardHeader>
            <CardContent>
              {!company.contacts || company.contacts.length === 0 ? (
                <p className="text-sm text-[#6B6B6B] text-center py-4">
                  Inga kontakter registrerade.
                </p>
              ) : (
                <div className="divide-y divide-[#B8B8B8]/40">
                  {company.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-[#6B6B6B]" />
                          <span className="font-medium text-sm">
                            {contact.name}
                          </span>
                          {contact.is_primary && (
                            <Star className="size-3 text-[#F2BB01] fill-[#F2BB01]" />
                          )}
                        </div>
                        {contact.title && (
                          <p className="text-xs text-[#6B6B6B] ml-5">
                            {contact.title}
                          </p>
                        )}
                        <div className="flex gap-3 ml-5 text-xs text-[#6B6B6B]">
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
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Affärer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#B8B8B8]/40">
                  {company.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/pipeline/${deal.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[#F2F2F0] -mx-4 px-4 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="size-4 text-[#6B6B6B]" />
                        <div>
                          <p className="text-sm font-medium">
                            {deal.quote_number || 'Affär'}
                          </p>
                          <p className="text-xs text-[#6B6B6B]">
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
              <AddNoteForm entityType="company" entityId={company.id} />
              <NotesTimeline notes={notes} entityType="company" entityId={company.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
