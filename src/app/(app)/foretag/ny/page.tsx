import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CompanyForm } from '@/components/companies/company-form'
import { getActiveUsers } from '@/lib/queries/users'
import { getResellers } from '@/lib/queries/companies'

export default async function NyttForetagPage() {
  const [users, resellers] = await Promise.all([getActiveUsers(), getResellers()])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/foretag">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Ny kund</h2>
      </div>
      <CompanyForm users={users} resellers={resellers} />
    </div>
  )
}
