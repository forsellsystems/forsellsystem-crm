import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReport } from '@/lib/queries/reports'
import { getCustomerCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import {
  getCustomerProspectsForSelect,
  getResellerProspectsForSelect,
} from '@/lib/queries/prospects'
import { REPORT_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { ReportMarkdown } from '@/components/reports/report-markdown'
import { ReportActionsBar } from '@/components/reports/report-actions-bar'
import { OutreachCard } from '@/components/reports/outreach-card'
import { outreachConfigured } from '@/lib/outreach/config'

export default async function RapportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [report, customers, resellers, customerProspects, resellerProspects] = await Promise.all([
    getReport(id),
    getCustomerCompaniesForSelect(),
    getResellers(),
    getCustomerProspectsForSelect(),
    getResellerProspectsForSelect(),
  ])

  if (!report) notFound()

  const status = REPORT_STATUSES.find((s) => s.key === report.status)
  const backHref = report.report_type === 'reseller' ? '/rapporter?flik=agent' : '/rapporter'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Link href={backHref}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="font-display text-3xl text-[#1A1A1A]">{report.company_name}</h2>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {[
                formatDate(report.report_date),
                report.icp_score != null ? `ICP ${report.icp_score}/100` : null,
                report.org_number,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        {status && (
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-[#6B6B6B]">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {status.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
                Uppgifter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#6B6B6B]">Organisationsnummer</span>
                <span className={report.org_number ? '' : 'text-[#B8B8B8]'}>
                  {report.org_number ?? 'Saknas i rapporten'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#6B6B6B] shrink-0">Webbplats</span>
                {report.website ? (
                  <a
                    href={report.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 truncate text-[#656565] underline underline-offset-2 hover:text-[#1A1A1A]"
                  >
                    <span className="truncate">{report.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[#B8B8B8]">Saknas i rapporten</span>
                )}
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#6B6B6B] shrink-0">Källfil</span>
                <span className="truncate text-[#9A9A9A]">{report.source_file}</span>
              </div>
              {report.linked_href && (
                <div className="flex justify-between gap-3 border-t border-[#B8B8B8]/40 pt-2">
                  <span className="text-[#6B6B6B] shrink-0">Kopplad till</span>
                  <Link href={report.linked_href} className="truncate text-[#656565] hover:underline">
                    {report.linked_name}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
                Vad vill du göra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReportActionsBar
                report={report}
                customers={customers}
                resellers={resellers}
                customerProspects={customerProspects}
                resellerProspects={resellerProspects}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <OutreachCard
            reportId={report.id}
            draft={report.outreach_draft}
            recipient={report.outreach_recipient}
            instruction={report.outreach_instruction}
            configured={outreachConfigured()}
          />
          <Card>
            <CardContent>
              <ReportMarkdown content={report.content} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
