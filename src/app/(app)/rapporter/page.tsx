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
import { FileText } from 'lucide-react'
import { getReports, getNewReportCounts } from '@/lib/queries/reports'
import { SectionTabs } from '@/components/layout/section-tabs'
import { REPORT_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { ReportUpload } from '@/components/reports/report-upload'

export default async function RapporterPage({
  searchParams,
}: {
  searchParams: Promise<{ flik?: string }>
}) {
  const { flik } = await searchParams
  // Kundspåret är förval: det är där rapporterna kommer i dag.
  const reportType = flik === 'agent' ? 'reseller' : 'customer'

  const [reports, counts] = await Promise.all([
    getReports(reportType),
    getNewReportCounts(),
  ])
  const nya = reports.filter((r) => r.status === 'ny').length

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Rapporter</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {nya > 0
              ? `${nya} otriagerad${nya === 1 ? '' : 'e'} att gå igenom`
              : 'Inget otriagerat'}
          </p>
        </div>
      </div>

      <SectionTabs
        items={[
          {
            label: 'Kunder',
            href: '/rapporter',
            active: reportType === 'customer',
            count: counts.customer,
          },
          {
            label: 'Agenter',
            href: '/rapporter?flik=agent',
            active: reportType === 'reseller',
            count: counts.reseller,
          },
        ]}
      />

      <ReportUpload reportType={reportType} />

      {reports.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <FileText className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">
                Inga {reportType === 'reseller' ? 'agentrapporter' : 'kundrapporter'} ännu.
              </p>
              <p className="text-xs mt-1">Ladda upp dagens rapport här ovanför.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Bolag</TableHead>
                  <TableHead>ICP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kopplad till</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  const status = REPORT_STATUSES.find((s) => s.key === r.status)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-[#6B6B6B] whitespace-nowrap">
                        {formatDate(r.report_date)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/rapporter/${r.id}`}
                          className="font-medium text-[#656565] hover:underline"
                        >
                          {r.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-[#6B6B6B]">
                        {r.icp_score != null ? `${r.icp_score}/100` : '—'}
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
                      <TableCell className="text-sm">
                        {r.linked_href ? (
                          <Link href={r.linked_href} className="text-[#6B6B6B] hover:underline">
                            {r.linked_name}
                          </Link>
                        ) : (
                          <span className="text-[#9A9A9A]">—</span>
                        )}
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
