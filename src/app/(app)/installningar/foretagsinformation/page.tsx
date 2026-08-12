import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCompanyInfo } from '@/lib/queries/company-info'
import { CompanyInfoCard } from '@/components/settings/company-info-card'

export default async function ForetagsinformationPage() {
  const rows = await getCompanyInfo()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/installningar">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Företagsinformation</h2>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Bolagets egen kontext: positionering, målgrupp, regler och termer
          </p>
        </div>
      </div>

      <CompanyInfoCard rows={rows} />
    </div>
  )
}
